import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.core.db import SessionLocal
from app.models.classroom import Classroom
from app.models.command import DeviceCommand

client = TestClient(app)
VALID_HEADERS = {"X-Device-Key": settings.DEVICE_KEY}

def test_sensor_ingest_auth_failure():
    # Missing header -> 401
    res = client.post("/api/sensor-data", json={"classroom_id": "A101"})
    assert res.status_code == 401

    # Invalid header -> 401
    res_bad = client.post(
        "/api/sensor-data",
        json={"classroom_id": "A101"},
        headers={"X-Device-Key": "wrong-key"}
    )
    assert res_bad.status_code == 401

def test_sensor_ingest_unknown_classroom_returns_404():
    payload = {
        "classroom_id": "UNKNOWN_ROOM_999",
        "device_id": "esp32-unknown",
        "pir_motion": True,
        "temperature": 27.0,
        "humidity": 55.0,
        "source": "simulation"
    }
    res = client.post("/api/sensor-data", json=payload, headers=VALID_HEADERS)
    assert res.status_code == 404
    assert "not provisioned" in res.json()["detail"].lower()

def test_sensor_ingest_validation():
    # Temperature out of range (> 60)
    res_temp = client.post(
        "/api/sensor-data",
        json={"classroom_id": "A101", "temperature": 85.0},
        headers=VALID_HEADERS
    )
    assert res_temp.status_code == 422

    # Invalid source (not simulation or esp32)
    res_src = client.post(
        "/api/sensor-data",
        json={"classroom_id": "A101", "source": "unauthorized_producer"},
        headers=VALID_HEADERS
    )
    assert res_src.status_code == 422

def test_sensor_ingest_simulation_success():
    payload = {
        "classroom_id": "A101",
        "device_id": "esp32-a101",
        "pir_motion": True,
        "event": "motion",
        "temperature": 28.0,
        "humidity": 61.0,
        "ac_status": True,
        "light_status": True,
        "wifi_rssi": -58,
        "source": "simulation",
        "timestamp": "2026-09-29T10:14:05Z"
    }
    res = client.post("/api/sensor-data", json=payload, headers=VALID_HEADERS)
    assert res.status_code == 202
    assert res.json() == {"accepted": True}

def test_sensor_ingest_esp32_accepted_identically():
    """
    Mandatory test (§5): Swapping 'Simulation -> ESP32' requires zero API changes.
    Proves the API accepts payload with source='esp32' identically to source='simulation'.
    """
    payload_esp32 = {
        "classroom_id": "A101",
        "device_id": "esp32-a101-hardware",
        "pir_motion": True,
        "event": "motion",
        "temperature": 28.0,
        "humidity": 61.0,
        "ac_status": True,
        "light_status": True,
        "wifi_rssi": -62,
        "source": "esp32", # Hardware firmware source (§5, §7.1)
        "timestamp": "2026-09-29T10:15:00Z"
    }
    res = client.post("/api/sensor-data", json=payload_esp32, headers=VALID_HEADERS)
    assert res.status_code == 202
    assert res.json() == {"accepted": True}

def test_command_polling_and_ack():
    # Insert a pending command
    db = SessionLocal()
    cmd = DeviceCommand(
        classroom_id="A101",
        device="ac",
        command="off",
        status="pending",
        requested_by="admin"
    )
    db.add(cmd)
    db.commit()
    cmd_id = cmd.id
    db.close()

    try:
        # Poll pending commands
        poll_res = client.get(
            "/api/classrooms/A101/commands/pending",
            headers=VALID_HEADERS
        )
        assert poll_res.status_code == 200
        commands = poll_res.json()
        assert any(c["id"] == cmd_id for c in commands)

        # Ack command
        ack_res = client.post(
            f"/api/commands/{cmd_id}/ack",
            headers=VALID_HEADERS
        )
        assert ack_res.status_code == 200
        assert ack_res.json()["acked"] is True
    finally:
        # Cleanup
        db = SessionLocal()
        c = db.get(DeviceCommand, cmd_id)
        if c:
            db.delete(c)
            db.commit()
        db.close()
