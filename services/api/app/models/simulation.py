from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base

class SimulatedApplianceState(Base):
    __tablename__ = "simulated_appliance_state"

    classroom_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("classrooms.id", ondelete="CASCADE"),
        primary_key=True
    )
    ac_simulated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    light_simulated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    
    # State transition tracking for interval-based energy calculations
    ac_switched_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    light_switched_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    
    # Energy calculations in kWh: Power (kW) * Time (hours)
    energy_consumed_kwh: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    energy_saved_kwh: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    energy_wasted_kwh: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    classroom = relationship("Classroom")


class SimulatedCommand(Base):
    __tablename__ = "simulated_commands"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    classroom_id: Mapped[str] = mapped_column(String(32), nullable=False)
    device: Mapped[str] = mapped_column(String(16), nullable=False) # 'ac' | 'light'
    command: Mapped[str] = mapped_column(String(16), nullable=False) # 'on' | 'off'
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="completed") # 'completed' | 'failed'
    requested_by: Mapped[str] = mapped_column(String(32), nullable=False, default="simulation_user")
    resulting_state: Mapped[bool] = mapped_column(Boolean, nullable=False)
    detail: Mapped[str] = mapped_column(String(256), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    __table_args__ = (
        Index("idx_sim_cmds_room", "classroom_id", "created_at"),
    )
