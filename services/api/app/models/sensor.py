from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, Boolean, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.core.db import Base

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    classroom_id: Mapped[str] = mapped_column(String(32), nullable=False)
    device_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    pir_motion: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    event: Mapped[str | None] = mapped_column(String(32), nullable=True) # e.g. "motion"
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    humidity: Mapped[float | None] = mapped_column(Float, nullable=True)
    ac_status: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    light_status: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    wifi_rssi: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="simulation") # simulation|esp32
    device_timestamp: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    received_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        Index("idx_sensor_room_received", "classroom_id", "received_at"),
    )
