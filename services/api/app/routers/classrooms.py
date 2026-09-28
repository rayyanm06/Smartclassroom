from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime, timezone

from app.core.db import get_db
from app.core.clock import system_clock
from app.models.classroom import Classroom, ClassroomState
from app.models.timetable import TimetableEntry
from app.models.alert import Alert
from app.models.snapshot import OccupancySnapshot
from app.schemas.classroom import (
    ClassroomCreate,
    ClassroomUpdate,
    ClassroomResponse,
    ClassroomWithStateResponse,
    ClassroomStateResponse,
)
from app.engine.schedule import get_active_entry, get_next_entry

router = APIRouter(prefix="/api/classrooms", tags=["classrooms"])

@router.get("", response_model=List[ClassroomWithStateResponse])
def list_classrooms(db: Session = Depends(get_db)):
    """Returns list of classrooms joined with their current live state (§7.2)."""
    stmt = select(Classroom).order_by(Classroom.id)
    classrooms = db.scalars(stmt).all()
    return classrooms

@router.post("", response_model=ClassroomResponse, status_code=status.HTTP_201_CREATED)
def create_classroom(payload: ClassroomCreate, db: Session = Depends(get_db)):
    """Creates a new classroom and provisions default classroom_state."""
    existing = db.get(Classroom, payload.id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Classroom with id '{payload.id}' already exists."
        )

    classroom = Classroom(**payload.model_dump())
    # Initialize default state
    state = ClassroomState(
        classroom_id=payload.id,
        occupancy_state="EMPTY",
        confidence_level="high",
        reasons=["Newly provisioned classroom node"],
        idle_minutes=0,
        ac_status=False,
        light_status=False,
        camera_online=False,
        sensor_online=False,
    )
    classroom.state = state
    db.add(classroom)
    db.commit()
    db.refresh(classroom)
    return classroom

@router.get("/{classroom_id}", response_model=dict)
def get_classroom_detail(classroom_id: str, db: Session = Depends(get_db)):
    """Returns detailed room status: state + active & next timetable entry + open alerts (§7.2)."""
    classroom = db.get(Classroom, classroom_id)
    if not classroom:
        raise HTTPException(status_code=404, detail=f"Classroom '{classroom_id}' not found.")

    now_ist = system_clock.now_ist()
    entries = classroom.timetable_entries

    current_entry = get_active_entry(entries, now_ist)
    next_entry = get_next_entry(entries, now_ist)

    # Fetch open alerts for this room
    alerts_stmt = select(Alert).where(Alert.classroom_id == classroom_id, Alert.status != "resolved")
    open_alerts = db.scalars(alerts_stmt).all()

    return {
        "classroom": ClassroomResponse.model_validate(classroom).model_dump(),
        "state": ClassroomStateResponse.model_validate(classroom.state).model_dump() if classroom.state else None,
        "current_entry": {
            "id": current_entry.id,
            "subject": current_entry.subject,
            "faculty": current_entry.faculty,
            "start_time": current_entry.start_time.strftime("%H:%M"),
            "end_time": current_entry.end_time.strftime("%H:%M"),
            "class_type": current_entry.class_type,
        } if current_entry else None,
        "next_entry": {
            "id": next_entry.id,
            "subject": next_entry.subject,
            "faculty": next_entry.faculty,
            "start_time": next_entry.start_time.strftime("%H:%M"),
            "end_time": next_entry.end_time.strftime("%H:%M"),
            "class_type": next_entry.class_type,
        } if next_entry else None,
        "open_alerts": [
            {
                "id": a.id,
                "type": a.type,
                "severity": a.severity,
                "headline": a.headline,
                "detail": a.detail,
                "status": a.status,
            } for a in open_alerts
        ]
    }

@router.put("/{classroom_id}", response_model=ClassroomResponse)
def update_classroom(classroom_id: str, payload: ClassroomUpdate, db: Session = Depends(get_db)):
    classroom = db.get(Classroom, classroom_id)
    if not classroom:
        raise HTTPException(status_code=404, detail=f"Classroom '{classroom_id}' not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(classroom, field, val)

    db.commit()
    db.refresh(classroom)
    return classroom

@router.delete("/{classroom_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_classroom(classroom_id: str, db: Session = Depends(get_db)):
    classroom = db.get(Classroom, classroom_id)
    if not classroom:
        raise HTTPException(status_code=404, detail=f"Classroom '{classroom_id}' not found.")

    db.delete(classroom)
    db.commit()
    return None

@router.get("/{classroom_id}/history")
def get_classroom_history(
    classroom_id: str,
    from_ts: Optional[datetime] = Query(None, alias="from"),
    to_ts: Optional[datetime] = Query(None, alias="to"),
    resolution: str = "1m",
    db: Session = Depends(get_db)
):
    """Returns snapshot history series for occupancy, temperature, and appliance status."""
    stmt = select(OccupancySnapshot).where(OccupancySnapshot.classroom_id == classroom_id)
    if from_ts:
        stmt = stmt.where(OccupancySnapshot.ts >= from_ts)
    if to_ts:
        stmt = stmt.where(OccupancySnapshot.ts <= to_ts)

    stmt = stmt.order_by(OccupancySnapshot.ts.desc()).limit(300)
    snapshots = db.scalars(stmt).all()
    
    return [
        {
            "ts": s.ts.isoformat(),
            "occupancy_state": s.occupancy_state,
            "people_count": s.people_count,
            "expected_occupancy": s.expected_occupancy,
            "temperature": s.temperature,
            "humidity": s.humidity,
            "ac_on": s.ac_on,
            "light_on": s.light_on,
            "idle_minutes": s.idle_minutes,
            "data_source": s.data_source,
        }
        for s in reversed(snapshots)
    ]
