from pydantic import BaseModel
from typing import Dict, Any, Literal, Optional

class SettingsUpdate(BaseModel):
    preset: Optional[Literal["production", "demo"]] = None
    values: Dict[str, Any] = {}

class SettingsResponse(BaseModel):
    preset: str
    values: Dict[str, Any]
