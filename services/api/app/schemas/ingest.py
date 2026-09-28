from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, Literal

class SensorEventSchema(BaseModel):
    classroom_id: str
    device_id: Optional[str] = None
    pir_motion: bool = False
    event: Optional[str] = None # e.g. "motion"
    temperature: Optional[float] = Field(None, ge=-10.0, le=60.0)
    humidity: Optional[float] = Field(None, ge=0.0, le=100.0)
    ac_status: bool = False
    light_status: bool = False
    wifi_rssi: Optional[int] = None
    source: Literal["simulation", "esp32"] = "simulation"
    timestamp: Optional[datetime] = None

class CameraEventSchema(BaseModel):
    classroom_id: str
    camera_id: str
    people_detected: int = Field(ge=0)
    confidence: float = Field(ge=0.0, le=1.0)
    source: str = "camera"
    fps: Optional[float] = None
    timestamp: Optional[datetime] = None
    occupancy_status: Optional[str] = None # Camera local hint, engine ignores per §7.1

class DeviceActionSchema(BaseModel):
    device: Literal["ac", "light"]
    command: Literal["on", "off"]
    requested_by: str = "admin"

class PendingCommandResponse(BaseModel):
    id: int
    classroom_id: str
    device: str
    command: str

class AckResponse(BaseModel):
    acked: bool = True
