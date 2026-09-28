from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import delete
from app.models.sensor import SensorReading
from app.models.camera import CameraDetection

def purge_stale_raw_data(db: Session, retention_days: int = 7) -> dict:
    """
    Deletes raw sensor readings and camera detections older than retention_days (§6).
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)

    sensor_del = db.execute(
        delete(SensorReading).where(SensorReading.received_at < cutoff)
    ).rowcount

    camera_del = db.execute(
        delete(CameraDetection).where(CameraDetection.received_at < cutoff)
    ).rowcount

    db.commit()
    return {"purged_sensor_readings": sensor_del, "purged_camera_detections": camera_del}
