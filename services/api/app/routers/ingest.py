from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timezone

from app.core.db import get_db
from app.core.security import verify_device_key
from app.core.clock import system_clock
from app.models.classroom import Classroom, ClassroomState
from app.models.sensor import SensorReading
from app.models.command import DeviceCommand
from app.schemas.ingest import (
    SensorEventSchema,
    CameraEventSchema,
    PendingCommandResponse,
    AckResponse,
)

router = APIRouter(prefix="/api", tags=["ingest"])

@router.post(
    "/sensor-data",
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(verify_device_key)]
)
def ingest_sensor_data(payload: SensorEventSchema, db: Session = Depends(get_db)):
    """
    Ingests raw sensor telemetry from either the sensor-sim or physical ESP32 (§7.1).
    Protected by X-Device-Key header.
    """
    # Verify classroom exists (no auto-provisioning per §7)
    classroom = db.get(Classroom, payload.classroom_id)
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Classroom '{payload.classroom_id}' is not provisioned."
        )

    # Persist raw sensor reading
    received_now = system_clock.now_utc()
    dev_ts = payload.timestamp if payload.timestamp else received_now

    reading = SensorReading(
        classroom_id=payload.classroom_id,
        device_id=payload.device_id,
        pir_motion=payload.pir_motion,
        event=payload.event,
        temperature=payload.temperature,
        humidity=payload.humidity,
        ac_status=payload.ac_status,
        light_status=payload.light_status,
        wifi_rssi=payload.wifi_rssi,
        source=payload.source,
        device_timestamp=dev_ts,
        received_at=received_now,
    )
    db.add(reading)

    # Update hot classroom_state telemetry fields (§6)
    if classroom.state:
        state = classroom.state
        state.last_sensor_at = received_now
        state.sensor_online = True
        if payload.temperature is not None:
            state.temperature = payload.temperature
        if payload.humidity is not None:
            state.humidity = payload.humidity
        state.ac_status = payload.ac_status
        state.light_status = payload.light_status

        if payload.pir_motion or payload.event == "motion":
            state.last_motion_at = received_now
            state.last_presence_at = received_now
            state.idle_minutes = 0

        # Run occupancy intelligence and energy alert evaluation (§8, §9)
        from app.engine.occupancy import evaluate_classroom_occupancy
        evaluate_classroom_occupancy(classroom, db)

    db.commit()
    return {"accepted": True}

@router.post(
    "/camera-data",
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(verify_device_key)]
)
def ingest_camera_data(payload: CameraEventSchema, db: Session = Depends(get_db)):
    """
    Ingests live optical person count telemetry from vision service (Phase 8).
    Protected by X-Device-Key header.
    """
    classroom = db.get(Classroom, payload.classroom_id)
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Classroom '{payload.classroom_id}' is not provisioned."
        )

    received_now = system_clock.now_utc()
    if classroom.state:
        state = classroom.state
        state.last_camera_at = received_now
        state.last_camera_count = payload.people_detected
        state.people_count = payload.people_detected
        state.camera_online = True

        from app.engine.occupancy import evaluate_classroom_occupancy
        evaluate_classroom_occupancy(classroom, db)

    db.commit()
    return {
        "accepted": True,
        "classroom_id": payload.classroom_id,
        "people_detected": payload.people_detected,
        "occupancy_state": classroom.state.occupancy_state if classroom.state else None,
    }

@router.get(
    "/classrooms/{classroom_id}/commands/pending",
    response_model=list[PendingCommandResponse],
    dependencies=[Depends(verify_device_key)]
)
def get_pending_commands(classroom_id: str, db: Session = Depends(get_db)):
    """Returns queued appliance commands awaiting execution by device (§7.1)."""
    stmt = (
        select(DeviceCommand)
        .where(
            DeviceCommand.classroom_id == classroom_id,
            DeviceCommand.status == "pending"
        )
        .order_by(DeviceCommand.created_at)
    )
    commands = db.scalars(stmt).all()
    return commands

@router.post(
    "/commands/{command_id}/ack",
    response_model=AckResponse,
    dependencies=[Depends(verify_device_key)]
)
def acknowledge_command(command_id: int, db: Session = Depends(get_db)):
    """Acknowledges appliance command execution by device (§7.1)."""
    command = db.get(DeviceCommand, command_id)
    if not command:
        raise HTTPException(status_code=404, detail=f"Command '{command_id}' not found.")

    command.status = "acked"
    command.acked_at = system_clock.now_utc()
    db.commit()
    return AckResponse(acked=True)
