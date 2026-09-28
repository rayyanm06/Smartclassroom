from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.core.db import Base

class PredictionModel(Base):
    __tablename__ = "prediction_models"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    trained_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    algorithm: Mapped[str] = mapped_column(String(64), nullable=False)
    n_rows: Mapped[int] = mapped_column(Integer, nullable=False)
    synthetic_fraction: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    metrics: Mapped[dict] = mapped_column(JSON, nullable=False)
    feature_importance: Mapped[dict] = mapped_column(JSON, nullable=False)
    artifact_path: Mapped[str] = mapped_column(String(256), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
