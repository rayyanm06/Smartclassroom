from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.clock import system_clock, TZ_IST
from app.models.classroom import Classroom, ClassroomState
from app.models.timetable import TimetableEntry
from app.models.alert import Alert
from app.models.snapshot import OccupancySnapshot
from app.engine.schedule import is_expected, get_active_entry

def trigger_or_update_alert(
    db: Session,
    classroom_id: str,
    alert_type: str,
    severity: str,
    headline: str,
    detail: str,
):
    """Creates a new alert or updates last_seen on an existing open alert."""
    now_utc = system_clock.now_utc()
    existing = db.scalar(
        select(Alert).where(
            Alert.classroom_id == classroom_id,
            Alert.type == alert_type,
            Alert.status.in_(["open", "acknowledged"]),
        )
    )
    if existing:
        existing.last_seen = now_utc
        existing.detail = detail
    else:
        alert = Alert(
            classroom_id=classroom_id,
            type=alert_type,
            severity=severity,
            headline=headline,
            detail=detail,
            status="open",
            first_seen=now_utc,
            last_seen=now_utc,
        )
        db.add(alert)

def resolve_alert_if_open(db: Session, classroom_id: str, alert_type: str):
    now_utc = system_clock.now_utc()
    existing = db.scalars(
        select(Alert).where(
            Alert.classroom_id == classroom_id,
            Alert.type == alert_type,
            Alert.status.in_(["open", "acknowledged"]),
        )
    ).all()
    for a in existing:
        a.status = "resolved"
        a.resolved_at = now_utc

def evaluate_classroom_occupancy(classroom: Classroom, db: Session):
    """
    Evaluates occupancy state fusion and generates timetable intelligence & energy alerts (§8, §9).
    """
    state = classroom.state
    if not state:
        return

    now_utc = system_clock.now_utc()
    if now_utc.tzinfo is None:
        now_utc = now_utc.replace(tzinfo=timezone.utc)
    now_ist = system_clock.now_ist()

    # 1. Timetable active query
    expected, active_entry = is_expected(classroom.timetable_entries, now_ist, pre_start_min=5, post_end_min=10)
    current_lecture = get_active_entry(classroom.timetable_entries, now_ist)
    active_sched = current_lecture or active_entry

    state.expected_occupancy = expected
    state.timetable_entry_id = active_sched.id if active_sched else None

    # 2. Presence telemetry check
    has_camera = classroom.has_camera and state.camera_online
    camera_people = state.people_count if has_camera else None
    
    def as_utc(dt):
        if dt is None:
            return None
        return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt

    recent_motion = False
    if state.last_motion_at:
        seconds_since_motion = (now_utc - as_utc(state.last_motion_at)).total_seconds()
        if seconds_since_motion < 180: # Motion within last 3 minutes
            recent_motion = True

    # Idle calculation
    if state.last_presence_at:
        presence_delta = (now_utc - as_utc(state.last_presence_at)).total_seconds()
        state.idle_minutes = max(0, int(presence_delta // 60))
    else:
        state.idle_minutes = 15

    # 3. Decision Matrix
    reasons = []

    if camera_people is not None and camera_people > 0:
        # Camera sees people
        state.last_presence_at = now_utc
        state.idle_minutes = 0
        if expected:
            state.occupancy_state = "OCCUPIED"
            state.confidence_level = "high"
            subj_name = active_sched.subject if active_sched else "Class"
            reasons.append(f"Camera: {camera_people} people detected")
            reasons.append(f"Timetable: {subj_name} scheduled ({active_sched.start_time.strftime('%H:%M')}–{active_sched.end_time.strftime('%H:%M')})")
            resolve_alert_if_open(db, classroom.id, "OCCUPANCY_ANOMALY")
        else:
            state.occupancy_state = "UNEXPECTED_OCCUPANCY"
            state.confidence_level = "high"
            reasons.append(f"Camera: {camera_people} people detected")
            reasons.append("No class scheduled on timetable for this slot")
    elif camera_people == 0:
        # Camera definitively sees 0 people
        if expected:
            # Anomaly: scheduled class but 0 presence!
            state.occupancy_state = "OCCUPANCY_ANOMALY"
            state.confidence_level = "high"
            subj_name = active_sched.subject if active_sched else "Class"
            anomaly_detail = f"{classroom.id} is scheduled for {subj_name}, but no human presence is currently detected."
            reasons.append(anomaly_detail)
            
            trigger_or_update_alert(
                db,
                classroom_id=classroom.id,
                alert_type="OCCUPANCY_ANOMALY",
                severity="warning",
                headline=f"Occupancy Anomaly in {classroom.id}",
                detail=anomaly_detail,
            )
        else:
            state.occupancy_state = "EMPTY"
            state.confidence_level = "high"
            reasons.append("Camera confirms 0 persons; no active timetable session")
            resolve_alert_if_open(db, classroom.id, "OCCUPANCY_ANOMALY")
    else:
        # No camera feed; relies on PIR
        if recent_motion:
            state.last_presence_at = now_utc
            state.idle_minutes = 0
            if expected:
                state.occupancy_state = "OCCUPIED"
                state.confidence_level = "medium"
                subj_name = active_sched.subject if active_sched else "Class"
                reasons.append("PIR sensor motion active")
                reasons.append(f"Timetable: {subj_name} scheduled")
                resolve_alert_if_open(db, classroom.id, "OCCUPANCY_ANOMALY")
            else:
                state.occupancy_state = "UNEXPECTED_OCCUPANCY"
                state.confidence_level = "medium"
                reasons.append("PIR sensor motion active without scheduled timetable session")
        else:
            if expected:
                # Scheduled class, but no motion detected
                if state.idle_minutes >= 5:
                    state.occupancy_state = "OCCUPANCY_ANOMALY"
                    state.confidence_level = "medium"
                    subj_name = active_sched.subject if active_sched else "Class"
                    anomaly_detail = f"{classroom.id} is scheduled for {subj_name}, but no human presence is currently detected."
                    reasons.append(anomaly_detail)
                    
                    trigger_or_update_alert(
                        db,
                        classroom_id=classroom.id,
                        alert_type="OCCUPANCY_ANOMALY",
                        severity="warning",
                        headline=f"Occupancy Anomaly in {classroom.id}",
                        detail=anomaly_detail,
                    )
                else:
                    state.occupancy_state = "EXPECTED_OCCUPANCY"
                    state.confidence_level = "low"
                    reasons.append("Timetable session starting; awaiting student arrivals")
            else:
                state.occupancy_state = "EMPTY"
                state.confidence_level = "high"
                reasons.append("No PIR motion detected; room unoccupied")
                resolve_alert_if_open(db, classroom.id, "OCCUPANCY_ANOMALY")

    state.reasons = reasons

    # 4. Energy Management Intelligence (§9)
    # If room appears unoccupied and AC/lights remain on:
    is_unoccupied = state.occupancy_state in ["EMPTY", "OCCUPANCY_ANOMALY"]
    if is_unoccupied:
        if state.ac_status:
            trigger_or_update_alert(
                db,
                classroom_id=classroom.id,
                alert_type="ENERGY_AC_IDLE",
                severity="warning",
                headline=f"Energy Waste: AC Active in Empty Room {classroom.id}",
                detail=f"{classroom.id} appears unoccupied while AC remains ON. Idle: {state.idle_minutes}m.",
            )
        else:
            resolve_alert_if_open(db, classroom.id, "ENERGY_AC_IDLE")

        if state.light_status:
            trigger_or_update_alert(
                db,
                classroom_id=classroom.id,
                alert_type="ENERGY_LIGHTS_IDLE",
                severity="info",
                headline=f"Energy Waste: Lights Active in Empty Room {classroom.id}",
                detail=f"{classroom.id} appears unoccupied while lights remain ON.",
            )
        else:
            resolve_alert_if_open(db, classroom.id, "ENERGY_LIGHTS_IDLE")
    else:
        # If room is occupied, resolve energy idle alerts
        resolve_alert_if_open(db, classroom.id, "ENERGY_AC_IDLE")
        resolve_alert_if_open(db, classroom.id, "ENERGY_LIGHTS_IDLE")

    # 5. Persist periodic occupancy snapshot
    last_snap = db.scalar(
        select(OccupancySnapshot)
        .where(OccupancySnapshot.classroom_id == classroom.id)
        .order_by(OccupancySnapshot.ts.desc())
        .limit(1)
    )
    should_snapshot = False
    if not last_snap:
        should_snapshot = True
    else:
        last_ts = last_snap.ts.replace(tzinfo=timezone.utc) if last_snap.ts.tzinfo is None else last_snap.ts
        time_diff = (now_utc - last_ts).total_seconds()
        if time_diff >= 60.0 or last_snap.occupancy_state != state.occupancy_state:
            should_snapshot = True

    if should_snapshot:
        snap = OccupancySnapshot(
            classroom_id=classroom.id,
            ts=now_utc,
            occupancy_state=state.occupancy_state,
            people_count=state.people_count,
            expected_occupancy=state.expected_occupancy,
            pir_active=recent_motion,
            temperature=state.temperature,
            humidity=state.humidity,
            ac_on=state.ac_status,
            light_on=state.light_status,
            idle_minutes=state.idle_minutes,
            data_source="live",
        )
        db.add(snap)


