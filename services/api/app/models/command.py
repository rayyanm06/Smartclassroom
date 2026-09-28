from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.core.db import Base

class DeviceCommand(Base):
    __tablename__ = "device_commands"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    classroom_id: Mapped[str] = mapped_column(String(32), nullable=False)
    device: Mapped[str] = mapped_column(String(16), nullable=False) # ac|light
    command: Mapped[str] = mapped_column(String(16), nullable=False) # on|off
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="pending") # pending|acked|expired
    requested_by: Mapped[str] = mapped_column(String(32), nullable=False, default="system") # admin|watchman|system
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    acked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    __table_args__ = (
        Index("idx_commands_room_status", "classroom_id", "status"),
    )
