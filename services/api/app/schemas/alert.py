from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    classroom_id: str
    type: str
    severity: str
    headline: str
    detail: str
    status: str
    first_seen: datetime
    last_seen: datetime
    resolved_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None
    created_at: datetime

class AlertActionResponse(BaseModel):
    id: int
    status: str
    action: str
