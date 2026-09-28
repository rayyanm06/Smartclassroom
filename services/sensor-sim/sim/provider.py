from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel

class SensorEvent(BaseModel):
    classroom_id: str
    device_id: Optional[str] = None
    pir_motion: bool = False
    event: Optional[str] = None # "motion" or None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    ac_status: bool = False
    light_status: bool = False
    wifi_rssi: Optional[int] = None
    source: str = "simulation" # simulation | esp32
    timestamp: str

class SensorProvider(ABC):
    """Abstract sensor provider interface (§5)."""

    @abstractmethod
    def next_reading(self, room_id: str) -> Optional[SensorEvent]:
        """Produces the next standard SensorEvent for a room or None if no event/heartbeat."""
        pass
