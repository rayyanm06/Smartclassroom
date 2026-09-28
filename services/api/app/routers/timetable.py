from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional

from app.core.db import get_db
from app.models.classroom import Classroom
from app.models.timetable import TimetableEntry
from app.schemas.timetable import (
    TimetableEntryCreate,
    TimetableEntryUpdate,
    TimetableEntryResponse,
)
from app.engine.schedule import check_time_overlap

router = APIRouter(prefix="/api/timetable", tags=["timetable"])

@router.get("", response_model=List[TimetableEntryResponse])
def get_timetable(
    classroom_id: Optional[str] = Query(None),
    day: Optional[int] = Query(None, ge=0, le=6),
    db: Session = Depends(get_db)
):
    stmt = select(TimetableEntry)
    if classroom_id:
        stmt = stmt.where(TimetableEntry.classroom_id == classroom_id)
    if day is not None:
        stmt = stmt.where(TimetableEntry.day_of_week == day)

    stmt = stmt.order_by(TimetableEntry.day_of_week, TimetableEntry.start_time)
    return db.scalars(stmt).all()

@router.post("", response_model=TimetableEntryResponse, status_code=status.HTTP_201_CREATED)
def create_timetable_entry(payload: TimetableEntryCreate, db: Session = Depends(get_db)):
    # Verify classroom exists
    classroom = db.get(Classroom, payload.classroom_id)
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Classroom '{payload.classroom_id}' does not exist."
        )

    # Check for overlapping entries for the same room on the same day (§6)
    existing_entries = db.scalars(
        select(TimetableEntry).where(
            TimetableEntry.classroom_id == payload.classroom_id,
            TimetableEntry.day_of_week == payload.day_of_week,
        )
    ).all()

    for entry in existing_entries:
        if check_time_overlap(payload.start_time, payload.end_time, entry.start_time, entry.end_time):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "Time slot conflicts with an existing timetable entry.",
                    "conflicting_entry": {
                        "id": entry.id,
                        "subject": entry.subject,
                        "faculty": entry.faculty,
                        "day_of_week": entry.day_of_week,
                        "start_time": entry.start_time.strftime("%H:%M:%S"),
                        "end_time": entry.end_time.strftime("%H:%M:%S"),
                    }
                }
            )

    new_entry = TimetableEntry(**payload.model_dump())
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

@router.put("/{entry_id}", response_model=TimetableEntryResponse)
def update_timetable_entry(entry_id: int, payload: TimetableEntryUpdate, db: Session = Depends(get_db)):
    entry = db.get(TimetableEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail=f"Timetable entry '{entry_id}' not found.")

    update_data = payload.model_dump(exclude_unset=True)
    target_day = update_data.get("day_of_week", entry.day_of_week)
    target_start = update_data.get("start_time", entry.start_time)
    target_end = update_data.get("end_time", entry.end_time)

    # Check conflict with other entries in same room/day
    existing_entries = db.scalars(
        select(TimetableEntry).where(
            TimetableEntry.classroom_id == entry.classroom_id,
            TimetableEntry.day_of_week == target_day,
            TimetableEntry.id != entry_id,
        )
    ).all()

    for other in existing_entries:
        if check_time_overlap(target_start, target_end, other.start_time, other.end_time):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "Update conflicts with an existing timetable entry.",
                    "conflicting_entry": {
                        "id": other.id,
                        "subject": other.subject,
                        "faculty": other.faculty,
                        "start_time": other.start_time.strftime("%H:%M:%S"),
                        "end_time": other.end_time.strftime("%H:%M:%S"),
                    }
                }
            )

    for field, val in update_data.items():
        setattr(entry, field, val)

    db.commit()
    db.refresh(entry)
    return entry

@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_timetable_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = db.get(TimetableEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail=f"Timetable entry '{entry_id}' not found.")

    db.delete(entry)
    db.commit()
    return None
