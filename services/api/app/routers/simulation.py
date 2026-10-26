from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from datetime import datetime, timezone
from typing import List, Dict, Any

from app.core.db import get_db
from app.core.clock import system_clock
from app.models.classroom import Classroom, ClassroomState
from app.models.setting import Setting
from app.models.simulation import SimulatedApplianceState, SimulatedCommand
from app.schemas.simulation import (
    SimulatedActionRequest,
    SimulatedCommandItem,
    SimulatedClassroomStateResponse,
    SimulationStatusResponse,
    SimulationModeToggleRequest,
    SimulationResetResponse,
)

router = APIRouter(prefix="/api/simulation", tags=["simulation"])

SIMULATION_BANNER = (
    "SIMULATION MODE — AC AND LIGHTS ARE VIRTUAL. NO PHYSICAL APPLIANCES ARE CONTROLLED."
)

def get_or_create_sim_setting(db: Session) -> Setting:
    setting = db.scalars(select(Setting).where(Setting.key == "simulation_mode")).first()
    if not setting:
        # Default to True so user can immediately demonstrate the interactive simulation
        setting = Setting(
            key="simulation_mode",
            preset="demo",
            value={"enabled": True},
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting

def get_or_create_sim_state(classroom_id: str, db: Session) -> SimulatedApplianceState:
    sim_state = db.get(SimulatedApplianceState, classroom_id)
    if not sim_state:
        now_utc = system_clock.now_utc()
        sim_state = SimulatedApplianceState(
            classroom_id=classroom_id,
            ac_simulated=False,
            light_simulated=False,
            ac_switched_at=now_utc,
            light_switched_at=now_utc,
            energy_consumed_kwh=0.0,
            energy_saved_kwh=0.0,
            energy_wasted_kwh=0.0,
        )
        db.add(sim_state)
        db.commit()
        db.refresh(sim_state)
    return sim_state

def calculate_room_sim_energy(classroom: Classroom, sim_state: SimulatedApplianceState, db: Session) -> Dict[str, float]:
    """
    Computes real-time interval energy based on the formula:
    Energy (kWh) = Power (kW) * Time (hours)
    """
    now_utc = system_clock.now_utc()
    ac_kw = classroom.ac_rated_kw or 1.5
    light_kw = classroom.lights_rated_kw or 0.3

    ac_hours = max(0.0, (now_utc - sim_state.ac_switched_at.replace(tzinfo=timezone.utc)).total_seconds() / 3600.0) if sim_state.ac_simulated else 0.0
    light_hours = max(0.0, (now_utc - sim_state.light_switched_at.replace(tzinfo=timezone.utc)).total_seconds() / 3600.0) if sim_state.light_simulated else 0.0

    current_consumed = round(sim_state.energy_consumed_kwh + (ac_kw * ac_hours) + (light_kw * light_hours), 2)
    
    # Waste only computed if room is CONFIRMED EMPTY
    is_confirmed_empty = classroom.state and classroom.state.occupancy_state == "EMPTY"
    current_wasted = sim_state.energy_wasted_kwh
    if is_confirmed_empty:
        current_wasted += (ac_kw * ac_hours) + (light_kw * light_hours)
    current_wasted = round(current_wasted, 2)

    return {
        "consumed_kwh": current_consumed,
        "saved_kwh": round(sim_state.energy_saved_kwh, 2),
        "wasted_kwh": current_wasted,
    }


@router.get("/status", response_model=SimulationStatusResponse)
def get_simulation_status(db: Session = Depends(get_db)):
    """Returns current campus simulation status, global counters, and energy estimates."""
    setting = get_or_create_sim_setting(db)
    is_enabled = bool(setting.value.get("enabled", True))

    classrooms = db.scalars(select(Classroom)).all()
    ac_on_count = 0
    lights_on_count = 0
    total_consumed = 0.0
    total_saved = 0.0
    total_wasted = 0.0
    rooms_with_waste = []

    for c in classrooms:
        sim_state = get_or_create_sim_state(c.id, db)
        if sim_state.ac_simulated:
            ac_on_count += 1
        if sim_state.light_simulated:
            lights_on_count += 1

        energy = calculate_room_sim_energy(c, sim_state, db)
        total_consumed += energy["consumed_kwh"]
        total_saved += energy["saved_kwh"]
        total_wasted += energy["wasted_kwh"]

        # Track possible waste in confirmed empty rooms
        if c.state and c.state.occupancy_state == "EMPTY" and (sim_state.ac_simulated or sim_state.light_simulated):
            rooms_with_waste.append(c.id)

    return SimulationStatusResponse(
        simulation_enabled=is_enabled,
        banner_message=SIMULATION_BANNER if is_enabled else "HARDWARE MODE ACTIVE — Displaying verified physical node telemetry.",
        total_simulated_appliances_on=ac_on_count + lights_on_count,
        simulated_ac_on_count=ac_on_count,
        simulated_lights_on_count=lights_on_count,
        total_energy_consumed_kwh=round(total_consumed, 2),
        total_energy_saved_kwh=round(total_saved, 2),
        total_energy_wasted_kwh=round(total_wasted, 2),
        rooms_with_waste=rooms_with_waste,
    )


@router.post("/mode", response_model=SimulationStatusResponse)
def set_simulation_mode(payload: SimulationModeToggleRequest, db: Session = Depends(get_db)):
    """Explicitly enables or disables software simulation mode."""
    setting = get_or_create_sim_setting(db)
    setting.value = {"enabled": payload.enabled}
    db.commit()
    db.refresh(setting)
    return get_simulation_status(db)


@router.get("/classrooms", response_model=Dict[str, SimulatedClassroomStateResponse])
def list_simulated_classrooms(db: Session = Depends(get_db)):
    """Returns simulated appliance states for all managed classrooms."""
    classrooms = db.scalars(select(Classroom)).all()
    result = {}

    for c in classrooms:
        sim_state = get_or_create_sim_state(c.id, db)
        energy = calculate_room_sim_energy(c, sim_state, db)

        # Get recent 3 commands
        cmds = db.scalars(
            select(SimulatedCommand)
            .where(SimulatedCommand.classroom_id == c.id)
            .order_by(SimulatedCommand.created_at.desc())
            .limit(3)
        ).all()

        result[c.id] = SimulatedClassroomStateResponse(
            classroom_id=c.id,
            ac_simulated=sim_state.ac_simulated,
            light_simulated=sim_state.light_simulated,
            ac_switched_at=sim_state.ac_switched_at.isoformat(),
            light_switched_at=sim_state.light_switched_at.isoformat(),
            energy_consumed_kwh=energy["consumed_kwh"],
            energy_saved_kwh=energy["saved_kwh"],
            energy_wasted_kwh=energy["wasted_kwh"],
            updated_at=sim_state.updated_at.isoformat(),
            recent_commands=[
                SimulatedCommandItem(
                    id=cmd.id,
                    classroom_id=cmd.classroom_id,
                    device=cmd.device,
                    command=cmd.command,
                    status=cmd.status,
                    resulting_state=cmd.resulting_state,
                    detail=cmd.detail,
                    created_at=cmd.created_at.isoformat(),
                )
                for cmd in cmds
            ],
        )

    return result


@router.get("/classrooms/{classroom_id}", response_model=SimulatedClassroomStateResponse)
def get_simulated_classroom(classroom_id: str, db: Session = Depends(get_db)):
    """Returns simulated state and recent simulated command history for a room."""
    classroom = db.get(Classroom, classroom_id)
    if not classroom:
        raise HTTPException(status_code=404, detail=f"Classroom '{classroom_id}' not found.")

    sim_state = get_or_create_sim_state(classroom_id, db)
    energy = calculate_room_sim_energy(classroom, sim_state, db)

    cmds = db.scalars(
        select(SimulatedCommand)
        .where(SimulatedCommand.classroom_id == classroom_id)
        .order_by(SimulatedCommand.created_at.desc())
        .limit(10)
    ).all()

    return SimulatedClassroomStateResponse(
        classroom_id=classroom_id,
        ac_simulated=sim_state.ac_simulated,
        light_simulated=sim_state.light_simulated,
        ac_switched_at=sim_state.ac_switched_at.isoformat(),
        light_switched_at=sim_state.light_switched_at.isoformat(),
        energy_consumed_kwh=energy["consumed_kwh"],
        energy_saved_kwh=energy["saved_kwh"],
        energy_wasted_kwh=energy["wasted_kwh"],
        updated_at=sim_state.updated_at.isoformat(),
        recent_commands=[
            SimulatedCommandItem(
                id=cmd.id,
                classroom_id=cmd.classroom_id,
                device=cmd.device,
                command=cmd.command,
                status=cmd.status,
                resulting_state=cmd.resulting_state,
                detail=cmd.detail,
                created_at=cmd.created_at.isoformat(),
            )
            for cmd in cmds
        ],
    )


@router.post("/classrooms/{classroom_id}/actions", response_model=SimulatedClassroomStateResponse)
def dispatch_simulated_action(
    classroom_id: str,
    action: SimulatedActionRequest,
    db: Session = Depends(get_db)
):
    """
    Executes a virtual appliance state transition in software simulation.
    Does NOT touch physical hardware, device_commands, or physical sensor telemetry.
    """
    classroom = db.get(Classroom, classroom_id)
    if not classroom:
        raise HTTPException(status_code=404, detail=f"Classroom '{classroom_id}' not found.")

    sim_state = get_or_create_sim_state(classroom_id, db)
    now_utc = system_clock.now_utc()

    target_on = (action.command == "on")
    device_name = "AC" if action.device == "ac" else "Lights"
    current_state = sim_state.ac_simulated if action.device == "ac" else sim_state.light_simulated

    # Idempotent verification
    if current_state == target_on:
        detail_msg = f"Virtual {device_name} was already {action.command.upper()}."
    else:
        # Calculate transition energy delta before flipping
        ac_kw = classroom.ac_rated_kw or 1.5
        light_kw = classroom.lights_rated_kw or 0.3
        device_kw = ac_kw if action.device == "ac" else light_kw
        prev_switched_at = sim_state.ac_switched_at if action.device == "ac" else sim_state.light_switched_at
        
        hours_active = max(0.0, (now_utc - prev_switched_at.replace(tzinfo=timezone.utc)).total_seconds() / 3600.0)
        
        if not target_on and current_state:
            # Turned OFF: Add consumed kWh during the interval
            interval_consumed = device_kw * hours_active
            sim_state.energy_consumed_kwh += interval_consumed
            
            # If room was confirmed EMPTY, credit simulated savings
            if classroom.state and classroom.state.occupancy_state == "EMPTY":
                # User intervened to eliminate waste
                sim_state.energy_saved_kwh += round(device_kw * 1.0, 2) # Est. 1 hour shutdown saving
                detail_msg = f"Virtual {device_name} turned OFF. Estimated energy waste prevented."
            else:
                detail_msg = f"Virtual {device_name} turned OFF successfully."
        else:
            # Turned ON
            detail_msg = f"Virtual {device_name} turned ON successfully."

        # Update simulated state
        if action.device == "ac":
            sim_state.ac_simulated = target_on
            sim_state.ac_switched_at = now_utc
        else:
            sim_state.light_simulated = target_on
            sim_state.light_switched_at = now_utc

    sim_state.updated_at = now_utc

    # Record in simulated_commands (isolated from real device_commands)
    sim_cmd = SimulatedCommand(
        classroom_id=classroom_id,
        device=action.device,
        command=action.command,
        status="completed",
        requested_by=action.requested_by,
        resulting_state=target_on,
        detail=detail_msg,
        created_at=now_utc,
    )
    db.add(sim_cmd)
    db.commit()
    db.refresh(sim_state)

    return get_simulated_classroom(classroom_id, db)


@router.post("/reset", response_model=SimulationResetResponse)
def reset_simulation(db: Session = Depends(get_db)):
    """
    Safely resets virtual appliance states to OFF and zeroes simulation energy counters.
    NEVER deletes physical telemetry, classrooms, timetable entries, or real device records.
    """
    now_utc = system_clock.now_utc()
    sim_states = db.scalars(select(SimulatedApplianceState)).all()
    for s in sim_states:
        s.ac_simulated = False
        s.light_simulated = False
        s.ac_switched_at = now_utc
        s.light_switched_at = now_utc
        s.energy_consumed_kwh = 0.0
        s.energy_saved_kwh = 0.0
        s.energy_wasted_kwh = 0.0
        s.updated_at = now_utc

    db.commit()
    return SimulationResetResponse(
        success=True,
        message="Simulation reset successfully. All virtual appliances set to OFF and simulated energy counters cleared. Hardware records remain intact.",
    )
