from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional

class ClassroomStateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    classroom_id: str
    occupancy_state: str
    confidence_level: str
    reasons: List[str]
    people_count: Optional[int] = None
    expected_occupancy: bool
    timetable_entry_id: Optional[int] = None
    last_camera_at: Optional[datetime] = None
    last_camera_count: Optional[int] = None
    last_sensor_at: Optional[datetime] = None
    last_motion_at: Optional[datetime] = None
    last_presence_at: Optional[datetime] = None
    idle_minutes: int
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    ac_status: bool
    light_status: bool
    camera_online: bool
    sensor_online: bool
    updated_at: datetime

class ClassroomBase(BaseModel):
    id: str # e.g. 'A101'
    name: str
    building: str
    floor: int = 1
    capacity: int = 40
    room_type: str = "lecture"
    has_camera: bool = False
    has_pir: bool = True
    has_dht: bool = True
    ac_rated_kw: float = 1.5
    lights_rated_kw: float = 0.3
    active: bool = True

class ClassroomCreate(ClassroomBase):
    pass

class ClassroomUpdate(BaseModel):
    name: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[int] = None
    capacity: Optional[int] = None
    room_type: Optional[str] = None
    has_camera: Optional[bool] = None
    has_pir: Optional[bool] = None
    has_dht: Optional[bool] = None
    ac_rated_kw: Optional[float] = None
    lights_rated_kw: Optional[float] = None
    active: Optional[bool] = None

class ClassroomResponse(ClassroomBase):
    model_config = ConfigDict(from_attributes=True)
    created_at: datetime

class ClassroomWithStateResponse(ClassroomResponse):
    model_config = ConfigDict(from_attributes=True)
    state: Optional[ClassroomStateResponse] = None
