from datetime import datetime, time, date, timezone
from sqlalchemy import String, Integer, Time, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base

class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    classroom_id: Mapped[str] = mapped_column(String(32), ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False)
    subject: Mapped[str] = mapped_column(String(128), nullable=False)
    faculty: Mapped[str] = mapped_column(String(128), nullable=False)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False) # 0=Mon ... 6=Sun
    start_time: Mapped[time] = mapped_column(Time, nullable=False) # Local IST
    end_time: Mapped[time] = mapped_column(Time, nullable=False)   # Local IST
    class_type: Mapped[str] = mapped_column(String(32), nullable=False, default="lecture") # lecture/lab/tutorial/exam/other
    division: Mapped[str | None] = mapped_column(String(64), nullable=True) # e.g. 'Division-A', 'Div A+B'
    batch: Mapped[str | None] = mapped_column(String(32), nullable=True) # e.g. 'Batch 1', 'A1'
    valid_from: Mapped[date | None] = mapped_column(Date, nullable=True)
    valid_to: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    classroom: Mapped["Classroom"] = relationship("Classroom", back_populates="timetable_entries")

    __table_args__ = (
        Index("idx_timetable_room_day", "classroom_id", "day_of_week"),
    )
