from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, Boolean, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.core.db import Base

class OccupancySnapshot(Base):
    __tablename__ = "occupancy_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    classroom_id: Mapped[str] = mapped_column(String(32), nullable=False)
    ts: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    occupancy_state: Mapped[str] = mapped_column(String(32), nullable=False)
    people_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    expected_occupancy: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    pir_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    humidity: Mapped[float | None] = mapped_column(Float, nullable=True)
    ac_on: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    light_on: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    idle_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    data_source: Mapped[str] = mapped_column(String(16), nullable=False, default="live") # live|seed

    __table_args__ = (
        Index("idx_snapshot_room_ts", "classroom_id", "ts"),
    )
