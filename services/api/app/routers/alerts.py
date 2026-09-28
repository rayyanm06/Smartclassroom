from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional

from app.core.db import get_db
from app.core.clock import system_clock
from app.models.alert import Alert
from app.schemas.alert import AlertResponse, AlertActionResponse

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("", response_model=List[AlertResponse])
def list_alerts(
    status: Optional[str] = Query(None),
    classroom_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    stmt = select(Alert)
    if status:
        stmt = stmt.where(Alert.status == status)
    if classroom_id:
        stmt = stmt.where(Alert.classroom_id == classroom_id)

    stmt = stmt.order_by(Alert.last_seen.desc())
    return db.scalars(stmt).all()

@router.post("/{alert_id}/acknowledge", response_model=AlertActionResponse)
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found.")

    alert.status = "acknowledged"
    alert.acknowledged_at = system_clock.now_utc()
    db.commit()
    return AlertActionResponse(id=alert.id, status=alert.status, action="acknowledged")

@router.post("/{alert_id}/resolve", response_model=AlertActionResponse)
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found.")

    alert.status = "resolved"
    alert.resolved_at = system_clock.now_utc()
    db.commit()
    return AlertActionResponse(id=alert.id, status=alert.status, action="resolved")
