import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone
from app.main import app
from app.core.db import get_db, Base, engine
from app.models.classroom import Classroom, ClassroomState
from app.models.simulation import SimulatedApplianceState, SimulatedCommand
from app.models.setting import Setting

@pytest.fixture
def client():
    return TestClient(app)

def test_simulation_status_and_mode_toggle(client):
    # Test GET /api/simulation/status
    res = client.get("/api/simulation/status")
    assert res.status_code == 200
    data = res.json()
    assert "simulation_enabled" in data
    assert "banner_message" in data
    assert "total_simulated_appliances_on" in data
    assert "total_energy_consumed_kwh" in data

    # Toggle mode to False (Hardware mode)
    res_toggle = client.post("/api/simulation/mode", json={"enabled": False})
    assert res_toggle.status_code == 200
    assert res_toggle.json()["simulation_enabled"] is False
    assert "HARDWARE MODE" in res_toggle.json()["banner_message"]

    # Toggle back to True (Simulation mode)
    res_toggle_back = client.post("/api/simulation/mode", json={"enabled": True})
    assert res_toggle_back.status_code == 200
    assert res_toggle_back.json()["simulation_enabled"] is True
    assert "SIMULATION MODE" in res_toggle_back.json()["banner_message"]

def test_virtual_appliance_switching_and_isolation(client):
    # Verify room 508 exists
    res_get = client.get("/api/classrooms/508")
    assert res_get.status_code == 200
    initial_hardware_ac = res_get.json()["state"]["ac_status"]

    # Dispatch simulated AC ON for room 508
    res_on = client.post(
        "/api/simulation/classrooms/508/actions",
        json={"device": "ac", "command": "on", "requested_by": "test_watchman"}
    )
    assert res_on.status_code == 200
    sim_data = res_on.json()
    assert sim_data["ac_simulated"] is True
    assert len(sim_data["recent_commands"]) >= 1
    assert sim_data["recent_commands"][0]["device"] == "ac"
    assert sim_data["recent_commands"][0]["command"] == "on"

    # CRITICAL: Verify physical hardware state was NOT mutated
    res_check = client.get("/api/classrooms/508")
    assert res_check.status_code == 200
    assert res_check.json()["state"]["ac_status"] == initial_hardware_ac

    # CRITICAL: Verify real device_commands queue did not receive simulated command
    with TestClient(app) as test_c:
        # Check that simulated commands do not appear in physical node polling
        res_pending = client.get(
            "/api/classrooms/508/commands/pending",
            headers={"X-Device-Key": "dev-esp32-secret-key-508"}
        )
        if res_pending.status_code == 200:
            for cmd in res_pending.json():
                assert cmd["device"] != "ac" or cmd.get("requested_by") != "test_watchman"

    # Turn virtual AC OFF
    res_off = client.post(
        "/api/simulation/classrooms/508/actions",
        json={"device": "ac", "command": "off", "requested_by": "test_watchman"}
    )
    assert res_off.status_code == 200
    assert res_off.json()["ac_simulated"] is False

def test_multi_room_independent_simulation(client):
    # Turn AC ON in room 508 and Lights ON in room A101
    res1 = client.post("/api/simulation/classrooms/508/actions", json={"device": "ac", "command": "on"})
    assert res1.status_code == 200
    assert res1.json()["ac_simulated"] is True

    res2 = client.post("/api/simulation/classrooms/002/actions", json={"device": "light", "command": "on"})
    assert res2.status_code == 200
    assert res2.json()["light_simulated"] is True

    # Check that 002 AC is not affected by 508
    assert res2.json()["ac_simulated"] is False

    # Check simulated classrooms list
    res_all = client.get("/api/simulation/classrooms")
    assert res_all.status_code == 200
    all_sims = res_all.json()
    assert "508" in all_sims
    assert "002" in all_sims
    assert all_sims["508"]["ac_simulated"] is True
    assert all_sims["002"]["light_simulated"] is True

def test_simulation_reset_safety(client):
    # Reset simulation
    res_reset = client.post("/api/simulation/reset")
    assert res_reset.status_code == 200
    assert res_reset.json()["success"] is True

    # Verify rooms have simulated appliances OFF
    res_508 = client.get("/api/simulation/classrooms/508")
    assert res_508.status_code == 200
    assert res_508.json()["ac_simulated"] is False
    assert res_508.json()["light_simulated"] is False

    # Verify physical classrooms still exist
    res_rooms = client.get("/api/classrooms")
    assert res_rooms.status_code == 200
    assert len(res_rooms.json()) >= 1

def test_energy_recommendations_and_unknown_occupancy(client):
    # First turn AC ON in room 508 (which has UNKNOWN occupancy due to offline camera)
    client.post("/api/simulation/classrooms/508/actions", json={"device": "ac", "command": "on"})

    # Fetch recommendations
    res_rec = client.get("/api/dashboard/energy-recommendations")
    assert res_rec.status_code == 200
    data = res_rec.json()
    assert "recommendations" in data
    assert "note" in data

    # Check that room 508 recommendation treats UNKNOWN occupancy as unverified, NOT empty!
    rec_508 = next((r for r in data["recommendations"] if r["classroom_id"] == "508"), None)
    if rec_508:
        assert rec_508["occupancy_confirmed"] is False
        assert rec_508["estimated_waste_kwh"] == 0.0 # No false waste asserted for unknown room
        assert "unverified" in rec_508["headline"].lower() or "unconfirmed" in rec_508["context"].lower()

def test_invalid_request_handling(client):
    # Non-existent classroom
    res = client.post("/api/simulation/classrooms/INVALID_ROOM/actions", json={"device": "ac", "command": "on"})
    assert res.status_code == 404

    # Invalid device
    res_dev = client.post("/api/simulation/classrooms/508/actions", json={"device": "refrigerator", "command": "on"})
    assert res_dev.status_code == 422
