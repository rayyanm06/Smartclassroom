from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.core.db import Base

class CameraDetection(Base):
    __tablename__ = "camera_detections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    classroom_id: Mapped[str] = mapped_column(String(32), nullable=False)
    camera_id: Mapped[str] = mapped_column(String(64), nullable=False)
    people_detected: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="camera")
    fps: Mapped[float | None] = mapped_column(Float, nullable=True)
    device_timestamp: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    received_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        Index("idx_camera_room_received", "classroom_id", "received_at"),
    )
