import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

def test_list_classrooms():
    response = client.get("/api/classrooms")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 12
    a101 = next((r for r in data if r["id"] == "A101"), None)
    assert a101 is not None
    assert a101["has_camera"] is True
    assert a101["state"]["classroom_id"] == "A101"

def test_classroom_crud():
    test_id = "TEST999"
    # 1. Create
    create_payload = {
        "id": test_id,
        "name": "Test Lab 999",
        "building": "Block T",
        "floor": 3,
        "capacity": 25,
        "room_type": "lab",
        "has_camera": False,
        "has_pir": True,
        "has_dht": True,
        "ac_rated_kw": 1.8,
        "lights_rated_kw": 0.35,
        "active": True
    }
    create_res = client.post("/api/classrooms", json=create_payload)
    assert create_res.status_code == 201
    assert create_res.json()["id"] == test_id

    # Duplicate check
    dup_res = client.post("/api/classrooms", json=create_payload)
    assert dup_res.status_code == 409

    # 2. Read detail
    detail_res = client.get(f"/api/classrooms/{test_id}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["classroom"]["id"] == test_id
    assert detail_data["state"]["occupancy_state"] == "EMPTY"

    # 3. Update
    update_res = client.put(f"/api/classrooms/{test_id}", json={"capacity": 30})
    assert update_res.status_code == 200
    assert update_res.json()["capacity"] == 30

    # 4. Delete
    delete_res = client.delete(f"/api/classrooms/{test_id}")
    assert delete_res.status_code == 204

    # Verify deleted
    get_res = client.get(f"/api/classrooms/{test_id}")
    assert get_res.status_code == 404

def test_timetable_overlap_returns_409():
    room_id = "A101"
    # Entry 1: Mon 12:00 to 13:00
    entry1_payload = {
        "classroom_id": room_id,
        "subject": "Compiler Design",
        "faculty": "Prof. Rao",
        "day_of_week": 0, # Monday
        "start_time": "12:00:00",
        "end_time": "13:00:00",
        "class_type": "lecture"
    }
    res1 = client.post("/api/timetable", json=entry1_payload)
    assert res1.status_code == 201
    entry1_id = res1.json()["id"]

    try:
        # Overlapping entry: Mon 12:30 to 13:30 (overlaps by 30 min)
        overlap_payload = {
            "classroom_id": room_id,
            "subject": "Distributed Systems",
            "faculty": "Dr. Sen",
            "day_of_week": 0,
            "start_time": "12:30:00",
            "end_time": "13:30:00",
            "class_type": "lecture"
        }
        res_overlap = client.post("/api/timetable", json=overlap_payload)
        # MUST return 409 with conflicting entry (§6, §19)
        assert res_overlap.status_code == 409
        err_data = res_overlap.json()["detail"]
        assert "conflicts" in err_data["message"].lower()
        assert err_data["conflicting_entry"]["id"] == entry1_id

        # Back-to-back entry: Mon 13:00 to 14:00 (touching boundaries do NOT conflict)
        back_to_back_payload = {
            "classroom_id": room_id,
            "subject": "Network Security",
            "faculty": "Prof. Verma",
            "day_of_week": 0,
            "start_time": "13:00:00",
            "end_time": "14:00:00",
            "class_type": "lecture"
        }
        res_b2b = client.post("/api/timetable", json=back_to_back_payload)
        assert res_b2b.status_code == 201
        entry2_id = res_b2b.json()["id"]

        # Clean up second entry
        client.delete(f"/api/timetable/{entry2_id}")
    finally:
        # Clean up first entry
        client.delete(f"/api/timetable/{entry1_id}")

def test_settings_presets():
    # 1. Read current settings
    res = client.get("/api/settings")
    assert res.status_code == 200
    data = res.json()
    assert "preset" in data
    assert "camera_fresh_sec" in data["values"]

    # 2. Switch to production preset
    res_prod = client.post("/api/settings/preset/production")
    assert res_prod.status_code == 200
    assert res_prod.json()["preset"] == "production"
    assert res_prod.json()["values"]["idle_alert_min"] == 15

    # 3. Switch back to demo preset
    res_demo = client.post("/api/settings/preset/demo")
    assert res_demo.status_code == 200
    assert res_demo.json()["preset"] == "demo"
    assert res_demo.json()["values"]["idle_alert_min"] == 1
