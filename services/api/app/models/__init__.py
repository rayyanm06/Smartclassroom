from app.core.db import Base
from app.models.classroom import Classroom, ClassroomState
from app.models.timetable import TimetableEntry
from app.models.sensor import SensorReading
from app.models.camera import CameraDetection
from app.models.snapshot import OccupancySnapshot
from app.models.alert import Alert
from app.models.command import DeviceCommand
from app.models.setting import Setting
from app.models.prediction import PredictionModel

__all__ = [
    "Base",
    "Classroom",
    "ClassroomState",
    "TimetableEntry",
    "SensorReading",
    "CameraDetection",
    "OccupancySnapshot",
    "Alert",
    "DeviceCommand",
    "Setting",
    "PredictionModel",
]
