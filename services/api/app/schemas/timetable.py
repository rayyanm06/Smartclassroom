from pydantic import BaseModel, ConfigDict
from datetime import time, date, datetime
from typing import Optional

class TimetableEntryBase(BaseModel):
    classroom_id: str
    subject: str
    faculty: str
    day_of_week: int # 0=Mon ... 6=Sun
    start_time: time
    end_time: time
    class_type: str = "lecture" # lecture/lab/tutorial/exam/other
    division: Optional[str] = None
    batch: Optional[str] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None

class TimetableEntryCreate(TimetableEntryBase):
    pass

class TimetableEntryUpdate(BaseModel):
    subject: Optional[str] = None
    faculty: Optional[str] = None
    day_of_week: Optional[int] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    class_type: Optional[str] = None
    division: Optional[str] = None
    batch: Optional[str] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None

class TimetableEntryResponse(TimetableEntryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
