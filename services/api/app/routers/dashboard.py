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
            elif st in ["SENSOR_UNCERTAIN", "UNKNOWN"]:
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

    # Simulation metrics
    from app.models.setting import Setting
    from app.models.simulation import SimulatedApplianceState
    sim_setting = db.scalars(select(Setting).where(Setting.key == "simulation_mode")).first()
    simulation_enabled = bool(sim_setting.value.get("enabled", True)) if sim_setting else True

    sim_appliances_on = 0
    possible_waste_count = 0
    if simulation_enabled:
        sim_states = db.scalars(select(SimulatedApplianceState)).all()
        sim_state_map = {s.classroom_id: s for s in sim_states}
        for c in classrooms:
            s = sim_state_map.get(c.id)
            if s:
                if s.ac_simulated:
                    sim_appliances_on += 1
                if s.light_simulated:
                    sim_appliances_on += 1
                if c.state and c.state.occupancy_state == "EMPTY" and (s.ac_simulated or s.light_simulated):
                    possible_waste_count += 1
    else:
        for c in classrooms:
            if c.state and c.state.occupancy_state == "EMPTY" and (c.state.ac_status or c.state.light_status):
                possible_waste_count += 1

    return {
        "total_classrooms": total_classrooms,
        "occupied_now": occupied_count,
        "empty_now": empty_count,
        "expected_now": expected_count,
        "unexpected_now": unexpected_count,
        "anomalies": anomalies_count,
        "sensor_uncertain": uncertain_count,
        "unknown_now": uncertain_count,
        "cameras_offline": max(0, camera_installed - camera_online),
        "sensors_offline": max(0, sensor_installed - sensor_online),
        "energy_alerts": energy_alerts_count,
        "rooms_in_use_pct": rooms_in_use_pct,
        "seat_utilization_pct": seat_util_pct,
        "avg_temperature": avg_temp,
        "camera_feeds_active": f"{camera_online} / {camera_installed}",
        "sensors_online": f"{sensor_online} / {sensor_installed}",
        "simulation_enabled": simulation_enabled,
        "simulated_appliances_on": sim_appliances_on,
        "possible_energy_waste_rooms": possible_waste_count,
    }

@router.get("/energy-recommendations")
def get_energy_recommendations(db: Session = Depends(get_db)):
    """Computes actionable energy saving recommendations from classrooms with active appliances."""
    from app.models.setting import Setting
    from app.models.simulation import SimulatedApplianceState
    sim_setting = db.scalars(select(Setting).where(Setting.key == "simulation_mode")).first()
    simulation_enabled = bool(sim_setting.value.get("enabled", True)) if sim_setting else True

    classrooms = db.scalars(select(Classroom)).all()
    recommendations = []
    total_waste_kwh = 0.0

    sim_states = {}
    if simulation_enabled:
        sim_states = {s.classroom_id: s for s in db.scalars(select(SimulatedApplianceState)).all()}

    for c in classrooms:
        state = c.state
        if not state:
            continue

        # Check either simulated or physical state depending on active mode
        if simulation_enabled:
            sim = sim_states.get(c.id)
            ac_on = sim.ac_simulated if sim else False
            lt_on = sim.light_simulated if sim else False
            mode_prefix = "Simulated "
        else:
            ac_on = state.ac_status
            lt_on = state.light_status
            mode_prefix = ""

        if not (ac_on or lt_on):
            continue

        # Differentiate CONFIRMED EMPTY vs UNKNOWN
        if state.occupancy_state in ["EMPTY", "OCCUPANCY_ANOMALY"]:
            ac_waste = (c.ac_rated_kw * (max(state.idle_minutes, 5) / 60.0)) if ac_on else 0.0
            lt_waste = (c.lights_rated_kw * (max(state.idle_minutes, 5) / 60.0)) if lt_on else 0.0
            room_waste = round(ac_waste + lt_waste, 2)
            total_waste_kwh += room_waste

            actions = []
            if ac_on:
                actions.append({"device": "ac", "command": "off"})
            if lt_on:
                actions.append({"device": "light", "command": "off"})

            headline = f"{mode_prefix}AC & Lights active in empty {c.id}" if (ac_on and lt_on) else f"{mode_prefix}AC active in empty {c.id}" if ac_on else f"{mode_prefix}Lights active in empty {c.id}"

            recommendations.append({
                "classroom_id": c.id,
                "building": c.building,
                "floor": c.floor,
                "headline": headline,
                "context": f"Room {c.id} is confirmed empty while its {mode_prefix.lower()}appliances are ON. Consider turning them OFF to reduce estimated energy use.",
                "idle_minutes": state.idle_minutes,
                "severity": "critical" if ac_on else "warning",
                "actions": actions,
                "estimated_waste_kwh": room_waste,
                "occupancy_confirmed": True,
                "ac_status": ac_on,
                "light_status": lt_on,
                "is_simulation": simulation_enabled,
            })
        elif state.occupancy_state == "UNKNOWN":
            # For UNKNOWN occupancy, do not claim empty or calculate definite waste
            recommendations.append({
                "classroom_id": c.id,
                "building": c.building,
                "floor": c.floor,
                "headline": f"{mode_prefix}Appliances ON in {c.id} with unverified occupancy",
                "context": f"Room {c.id} occupancy cannot be confirmed because camera feed is offline. Check the room or camera before deciding whether to turn appliances OFF.",
                "idle_minutes": state.idle_minutes,
                "severity": "info",
                "actions": [],
                "estimated_waste_kwh": 0.0,
                "occupancy_confirmed": False,
                "ac_status": ac_on,
                "light_status": lt_on,
                "is_simulation": simulation_enabled,
            })

    recommendations.sort(key=lambda x: x["estimated_waste_kwh"], reverse=True)
    return {
        "total_waste_kwh": round(total_waste_kwh, 2),
        "count": len(recommendations),
        "recommendations": recommendations,
        "note": "Energy values are estimates based on configured simulation assumptions, not readings from a physical electricity meter.",
    }

