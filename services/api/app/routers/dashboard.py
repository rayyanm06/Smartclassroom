from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import Dict, Any

from app.core.db import get_db
from app.models.classroom import Classroom, ClassroomState
from app.models.alert import Alert

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/summary", response_model=Dict[str, Any])
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Computes real-time campus operational KPIs (§13).
    """
    classrooms = db.scalars(select(Classroom)).all()
    total_classrooms = len(classrooms)

    if total_classrooms == 0:
        return {
            "total_classrooms": 0,
            "occupied_now": 0,
            "empty_now": 0,
            "expected_now": 0,
            "unexpected_now": 0,
            "anomalies": 0,
            "sensor_uncertain": 0,
            "energy_alerts": 0,
            "rooms_in_use_pct": 0.0,
            "seat_utilization_pct": 0.0,
            "avg_temperature": 0.0,
            "camera_feeds_active": "0 / 0",
            "sensors_online": "0 / 0",
        }

    occupied_count = 0
    empty_count = 0
    expected_count = 0
    unexpected_count = 0
    anomalies_count = 0
    uncertain_count = 0

    camera_installed = 0
    camera_online = 0
    sensor_installed = 0
    sensor_online = 0

    total_temp = 0.0
    temp_count = 0

    camera_seat_capacity = 0
    camera_people_count = 0

    for c in classrooms:
        if c.has_camera:
            camera_installed += 1
            if c.state and c.state.camera_online:
                camera_online += 1
            if c.state and c.state.people_count is not None:
                camera_people_count += c.state.people_count
                camera_seat_capacity += c.capacity

        if c.has_pir or c.has_dht:
            sensor_installed += 1
            if c.state and c.state.sensor_online:
                sensor_online += 1

        if c.state:
            st = c.state.occupancy_state
            if st == "OCCUPIED":
                occupied_count += 1
            elif st == "EMPTY":
                empty_count += 1
            elif st == "EXPECTED_OCCUPANCY":
                expected_count += 1
            elif st == "UNEXPECTED_OCCUPANCY":
                unexpected_count += 1
            elif st == "OCCUPANCY_ANOMALY":
                anomalies_count += 1
            elif st == "SENSOR_UNCERTAIN":
                uncertain_count += 1

            if c.state.temperature is not None:
                total_temp += c.state.temperature
                temp_count += 1

    # Open energy alerts
    energy_alerts_count = db.scalar(
        select(func.count(Alert.id)).where(
            Alert.status != "resolved",
            Alert.type.in_(["ENERGY_AC_IDLE", "ENERGY_LIGHTS_IDLE"])
        )
    ) or 0

    rooms_in_use_pct = round(((occupied_count + unexpected_count) / total_classrooms) * 100, 1)
    seat_util_pct = (
        round((camera_people_count / camera_seat_capacity) * 100, 1)
        if camera_seat_capacity > 0 else 0.0
    )
    avg_temp = round(total_temp / temp_count, 1) if temp_count > 0 else 27.0

    return {
        "total_classrooms": total_classrooms,
        "occupied_now": occupied_count,
        "empty_now": empty_count,
        "expected_now": expected_count,
        "unexpected_now": unexpected_count,
        "anomalies": anomalies_count,
        "sensor_uncertain": uncertain_count,
        "energy_alerts": energy_alerts_count,
        "rooms_in_use_pct": rooms_in_use_pct,
        "seat_utilization_pct": seat_util_pct,
        "avg_temperature": avg_temp,
        "camera_feeds_active": f"{camera_online} / {camera_installed}",
        "sensors_online": f"{sensor_online} / {sensor_installed}",
    }
