from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime

class SimulatedActionRequest(BaseModel):
    device: Literal["ac", "light"]
    command: Literal["on", "off"]
    requested_by: str = "simulation_user"

class SimulatedCommandItem(BaseModel):
    id: int
    classroom_id: str
    device: str
    command: str
    status: str
    resulting_state: bool
    detail: str
    created_at: str

class SimulatedClassroomStateResponse(BaseModel):
    classroom_id: str
    ac_simulated: bool
    light_simulated: bool
    ac_switched_at: str
    light_switched_at: str
    energy_consumed_kwh: float
    energy_saved_kwh: float
    energy_wasted_kwh: float
    updated_at: str
    recent_commands: List[SimulatedCommandItem] = []

class SimulationStatusResponse(BaseModel):
    simulation_enabled: bool
    banner_message: str
    total_simulated_appliances_on: int
    simulated_ac_on_count: int
    simulated_lights_on_count: int
    total_energy_consumed_kwh: float
    total_energy_saved_kwh: float
    total_energy_wasted_kwh: float
    rooms_with_waste: List[str] = []

class SimulationModeToggleRequest(BaseModel):
    enabled: bool

class SimulationResetResponse(BaseModel):
    success: bool
    message: str
