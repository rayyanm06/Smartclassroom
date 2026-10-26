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
    PIR sensor and camera operate independently and simultaneously.
    """
    state = classroom.state
    if not state:
        return

    now_utc = system_clock.now_utc()
    if now_utc.tzinfo is None:
        now_utc = now_utc.replace(tzinfo=timezone.utc)
    now_ist = system_clock.now_ist()

    def as_utc(dt):
        if dt is None:
            return None
        return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt

    # 1. Freshness evaluation
    # Camera freshness: 20 seconds (vision service reports every 2s)
    camera_fresh = False
    if state.last_camera_at:
        cam_age = (now_utc - as_utc(state.last_camera_at)).total_seconds()
        if cam_age <= 20.0:
            camera_fresh = True

    # Synchronize camera_online flag with real freshness
    if not camera_fresh:
        state.camera_online = False

    # Sensor (ESP32) freshness: 45 seconds (hardware heartbeat is 10s)
    sensor_fresh = False
    if state.last_sensor_at:
        sensor_age = (now_utc - as_utc(state.last_sensor_at)).total_seconds()
        if sensor_age <= 45.0:
            sensor_fresh = True
    state.sensor_online = sensor_fresh

    # Motion state: active within last 3 minutes (180s)
    recent_motion = False
    if state.last_motion_at:
        seconds_since_motion = (now_utc - as_utc(state.last_motion_at)).total_seconds()
        if seconds_since_motion < 180.0:
            recent_motion = True

    # Idle calculation
    if state.last_presence_at:
        presence_delta = (now_utc - as_utc(state.last_presence_at)).total_seconds()
        state.idle_minutes = max(0, int(presence_delta // 60))
    else:
        state.idle_minutes = 15

    # 2. Timetable active query
    expected, active_entry = is_expected(classroom.timetable_entries, now_ist, pre_start_min=5, post_end_min=10)
    current_lecture = get_active_entry(classroom.timetable_entries, now_ist)
    active_sched = current_lecture or active_entry

    state.expected_occupancy = expected
    state.timetable_entry_id = active_sched.id if active_sched else None

    # 3. Decision Matrix
    reasons = []

    if classroom.has_camera:
        if state.camera_online and camera_fresh:
            # Live, fresh camera feed available
            resolve_alert_if_open(db, classroom.id, "CAMERA_OFFLINE")
            camera_people = state.people_count

            if camera_people is not None and camera_people > 0:
                state.last_presence_at = now_utc
                state.idle_minutes = 0
                state.occupancy_state = "OCCUPIED"
                state.confidence_level = "high"

                people_str = f"{camera_people} {'person' if camera_people == 1 else 'people'} detected"
                motion_str = "Movement detected" if recent_motion else "No recent movement"
                reasons.append(f"{people_str}. {motion_str}. Classroom is occupied.")

                if expected:
                    subj = active_sched.subject if active_sched else "Scheduled class"
                    reasons.append(f"Schedule: {subj} is currently in session.")
                    resolve_alert_if_open(db, classroom.id, "OCCUPANCY_ANOMALY")
                else:
                    reasons.append("Notice: No class is scheduled on the timetable for this hour.")

            elif camera_people == 0:
                # Camera confirmed 0 people
                if recent_motion:
                    # Sensor-camera disagreement
                    reasons.append("Movement detected, but no people are currently visible. Checking occupancy.")
                    if expected:
                        state.occupancy_state = "OCCUPANCY_ANOMALY"
                        state.confidence_level = "medium"
                        subj = active_sched.subject if active_sched else "Scheduled class"
                        reasons.append(f"Schedule expects {subj}, but 0 people are visible on camera.")
                        trigger_or_update_alert(
                            db,
                            classroom_id=classroom.id,
                            alert_type="OCCUPANCY_ANOMALY",
                            severity="warning",
                            headline=f"Occupancy Anomaly in Room {classroom.id}",
                            detail=f"Class {subj} is scheduled, but no people are visible on camera.",
                        )
                    else:
                        state.occupancy_state = "EMPTY"
                        state.confidence_level = "medium"
                        reasons.append("Classroom confirmed empty by camera view. Sensor movement may be near doorway.")
                        resolve_alert_if_open(db, classroom.id, "OCCUPANCY_ANOMALY")
                else:
                    if expected:
                        state.occupancy_state = "OCCUPANCY_ANOMALY"
                        state.confidence_level = "high"
                        subj = active_sched.subject if active_sched else "Scheduled class"
                        detail_msg = f"{classroom.id} is scheduled for {subj}, but no people are detected."
                        reasons.append(detail_msg)
                        trigger_or_update_alert(
                            db,
                            classroom_id=classroom.id,
                            alert_type="OCCUPANCY_ANOMALY",
                            severity="warning",
                            headline=f"Occupancy Anomaly in Room {classroom.id}",
                            detail=detail_msg,
                        )
                    else:
                        state.occupancy_state = "EMPTY"
                        state.confidence_level = "high"
                        reasons.append("Camera confirms 0 people and sensor reports no movement. Classroom is empty.")
                        resolve_alert_if_open(db, classroom.id, "OCCUPANCY_ANOMALY")
            else:
                state.occupancy_state = "UNKNOWN"
                state.confidence_level = "low"
                reasons.append("Camera count is unavailable; occupancy cannot currently be confirmed.")
        else:
            # Camera is offline / stale
            state.occupancy_state = "UNKNOWN"
            state.confidence_level = "low"
            trigger_or_update_alert(
                db,
                classroom_id=classroom.id,
                alert_type="CAMERA_OFFLINE",
                severity="warning",
                headline=f"Camera Offline in Room {classroom.id}",
                detail=f"The camera in Room {classroom.id} is not providing live frames. Occupancy cannot be confirmed.",
            )
            if recent_motion:
                reasons.append("Movement detected, but the camera is unavailable. The number of people cannot be confirmed.")
            else:
                reasons.append("The camera is offline and cannot confirm occupancy. Sensor reports no recent movement.")
    else:
        # Classroom without optical surveillance; relies on PIR and timetable
        if recent_motion:
            state.last_presence_at = now_utc
            state.idle_minutes = 0
            state.occupancy_state = "OCCUPIED" if expected else "UNEXPECTED_OCCUPANCY"
            state.confidence_level = "medium"
            if expected:
                subj = active_sched.subject if active_sched else "Scheduled class"
                reasons.append(f"Movement detected by sensor. Schedule: {subj} in session.")
                resolve_alert_if_open(db, classroom.id, "OCCUPANCY_ANOMALY")
            else:
                reasons.append("Movement detected by sensor, but no class is scheduled on the timetable.")
        else:
            if expected:
                if state.idle_minutes >= 5:
                    state.occupancy_state = "OCCUPANCY_ANOMALY"
                    state.confidence_level = "medium"
                    subj = active_sched.subject if active_sched else "Class"
                    reasons.append(f"Scheduled for {subj}, but no movement detected for {state.idle_minutes}m.")
                    trigger_or_update_alert(
                        db,
                        classroom_id=classroom.id,
                        alert_type="OCCUPANCY_ANOMALY",
                        severity="warning",
                        headline=f"Occupancy Anomaly in Room {classroom.id}",
                        detail=f"{classroom.id} is scheduled for {subj}, but no human presence is detected.",
                    )
                else:
                    state.occupancy_state = "EXPECTED_OCCUPANCY"
                    state.confidence_level = "low"
                    reasons.append("Class scheduled to start; awaiting student arrivals.")
            else:
                state.occupancy_state = "EMPTY"
                state.confidence_level = "high"
                reasons.append("No movement detected; no class scheduled.")
                resolve_alert_if_open(db, classroom.id, "OCCUPANCY_ANOMALY")

    state.reasons = reasons

    # 4. Energy Management Intelligence (§9)
    # Only confirmed empty rooms (not UNKNOWN) trigger energy alerts
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


