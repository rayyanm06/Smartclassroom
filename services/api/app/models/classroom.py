from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base

class Classroom(Base):
    __tablename__ = "classrooms"

    id: Mapped[str] = mapped_column(String(32), primary_key=True) # e.g. 'A101'
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    building: Mapped[str] = mapped_column(String(64), nullable=False)
    floor: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=40)
    room_type: Mapped[str] = mapped_column(String(32), nullable=False, default="lecture")
    has_camera: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    has_pir: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    has_dht: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    ac_rated_kw: Mapped[float] = mapped_column(Float, nullable=False, default=1.5)
    lights_rated_kw: Mapped[float] = mapped_column(Float, nullable=False, default=0.3)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    state: Mapped["ClassroomState"] = relationship("ClassroomState", back_populates="classroom", uselist=False, cascade="all, delete-orphan")
    timetable_entries: Mapped[list["TimetableEntry"]] = relationship("TimetableEntry", back_populates="classroom", cascade="all, delete-orphan")


class ClassroomState(Base):
    __tablename__ = "classroom_state"

    classroom_id: Mapped[str] = mapped_column(String(32), ForeignKey("classrooms.id", ondelete="CASCADE"), primary_key=True)
    occupancy_state: Mapped[str] = mapped_column(String(32), nullable=False, default="EMPTY")
    confidence_level: Mapped[str] = mapped_column(String(16), nullable=False, default="high") # high/medium/low
    reasons: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    people_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    expected_occupancy: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    timetable_entry_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    last_camera_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_camera_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_sensor_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_motion_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_presence_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    idle_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    humidity: Mapped[float | None] = mapped_column(Float, nullable=True)
    ac_status: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    light_status: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    camera_online: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    sensor_online: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    classroom: Mapped["Classroom"] = relationship("Classroom", back_populates="state")
