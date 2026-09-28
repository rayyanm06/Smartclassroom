import argparse
import sys
from pathlib import Path
from datetime import time, date, datetime, timezone

# Add services/api to sys.path
API_DIR = Path(__file__).resolve().parent.parent / "services" / "api"
sys.path.insert(0, str(API_DIR))

from app.core.db import SessionLocal
from app.models.classroom import Classroom, ClassroomState
from app.models.timetable import TimetableEntry
from app.models.setting import Setting
from app.models.snapshot import OccupancySnapshot
from app.core.settings_defaults import PRESET_DEFAULTS

CLASSROOMS_SEED = [
    # Block A
    {"id": "A101", "name": "Lecture Hall A101", "building": "Block A", "floor": 1, "capacity": 60, "room_type": "lecture", "has_camera": True, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.5, "lights_rated_kw": 0.3},
    {"id": "A102", "name": "Classroom A102", "building": "Block A", "floor": 1, "capacity": 40, "room_type": "lecture", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.5, "lights_rated_kw": 0.3},
    {"id": "A201", "name": "Seminar Room A201", "building": "Block A", "floor": 2, "capacity": 50, "room_type": "seminar", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 2.0, "lights_rated_kw": 0.4},
    # Block B
    {"id": "B201", "name": "Classroom B201", "building": "Block B", "floor": 2, "capacity": 60, "room_type": "lecture", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.5, "lights_rated_kw": 0.3},
    {"id": "B202", "name": "Lab B202", "building": "Block B", "floor": 2, "capacity": 35, "room_type": "lab", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 2.2, "lights_rated_kw": 0.5},
    {"id": "B203", "name": "Lecture Hall B203", "building": "Block B", "floor": 2, "capacity": 70, "room_type": "lecture", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.5, "lights_rated_kw": 0.3},
    # Block C
    {"id": "C101", "name": "Classroom C101", "building": "Block C", "floor": 1, "capacity": 50, "room_type": "lecture", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.5, "lights_rated_kw": 0.3},
    {"id": "C102", "name": "Classroom C102", "building": "Block C", "floor": 1, "capacity": 50, "room_type": "lecture", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.5, "lights_rated_kw": 0.3},
    {"id": "C201", "name": "Seminar Hall C201", "building": "Block C", "floor": 2, "capacity": 80, "room_type": "seminar", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 3.0, "lights_rated_kw": 0.8},
    # Block D
    {"id": "D101", "name": "Tutorial Room D101", "building": "Block D", "floor": 1, "capacity": 30, "room_type": "lecture", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.2, "lights_rated_kw": 0.25},
    {"id": "D102", "name": "Classroom D102", "building": "Block D", "floor": 1, "capacity": 45, "room_type": "lecture", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.5, "lights_rated_kw": 0.3},
    {"id": "D201", "name": "Lab D201", "building": "Block D", "floor": 2, "capacity": 40, "room_type": "lab", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 2.0, "lights_rated_kw": 0.4},
]

TIMETABLE_SEED = [
    # A101 (Camera room)
    {"classroom_id": "A101", "subject": "Database Management Systems", "faculty": "Dr. Sharma", "day_of_week": 0, "start_time": time(9, 0), "end_time": time(10, 0), "class_type": "lecture"},
    {"classroom_id": "A101", "subject": "Computer Networks", "faculty": "Prof. Verma", "day_of_week": 0, "start_time": time(10, 0), "end_time": time(11, 0), "class_type": "lecture"},
    {"classroom_id": "A101", "subject": "Artificial Intelligence", "faculty": "Dr. Rao", "day_of_week": 0, "start_time": time(11, 0), "end_time": time(12, 0), "class_type": "lecture"},
    {"classroom_id": "A101", "subject": "Database Lab", "faculty": "Dr. Sharma", "day_of_week": 0, "start_time": time(14, 0), "end_time": time(16, 0), "class_type": "lab"},
    {"classroom_id": "A101", "subject": "Software Engineering", "faculty": "Prof. Nair", "day_of_week": 1, "start_time": time(10, 0), "end_time": time(11, 0), "class_type": "lecture"},
    {"classroom_id": "A101", "subject": "Operating Systems", "faculty": "Dr. Gupta", "day_of_week": 2, "start_time": time(9, 0), "end_time": time(10, 0), "class_type": "lecture"},
    
    # B201
    {"classroom_id": "B201", "subject": "Design & Analysis of Algorithms", "faculty": "Prof. Kulkarni", "day_of_week": 0, "start_time": time(10, 0), "end_time": time(11, 0), "class_type": "lecture"},
    {"classroom_id": "B201", "subject": "Theory of Computation", "faculty": "Dr. Patel", "day_of_week": 0, "start_time": time(11, 0), "end_time": time(12, 0), "class_type": "lecture"},
    
    # B203
    {"classroom_id": "B203", "subject": "Computer Networks", "faculty": "Prof. Verma", "day_of_week": 0, "start_time": time(10, 0), "end_time": time(11, 0), "class_type": "lecture"},
    
    # C201
    {"classroom_id": "C201", "subject": "Cloud Computing Seminar", "faculty": "Dr. Sen", "day_of_week": 0, "start_time": time(14, 0), "end_time": time(16, 0), "class_type": "seminar"},
    
    # D101
    {"classroom_id": "D101", "subject": "Applied Mathematics Tutorial", "faculty": "Prof. Iyer", "day_of_week": 0, "start_time": time(9, 0), "end_time": time(10, 0), "class_type": "tutorial"},
]

def seed_classrooms(db):
    print("Seeding classrooms...")
    for data in CLASSROOMS_SEED:
        existing = db.get(Classroom, data["id"])
        if not existing:
            room = Classroom(**data)
            state = ClassroomState(
                classroom_id=data["id"],
                occupancy_state="EMPTY",
                confidence_level="high",
                reasons=["Classroom provisioned by seed script"],
                idle_minutes=0,
                ac_status=False,
                light_status=False,
                camera_online=data["has_camera"],
                sensor_online=True,
            )
            room.state = state
            db.add(room)
            print(f"  + Added classroom {data['id']} ({data['building']})")
        else:
            print(f"  * Classroom {data['id']} already exists")
    db.commit()

def seed_timetable(db):
    print("Seeding timetable...")
    for data in TIMETABLE_SEED:
        existing = db.query(TimetableEntry).filter(
            TimetableEntry.classroom_id == data["classroom_id"],
            TimetableEntry.day_of_week == data["day_of_week"],
            TimetableEntry.start_time == data["start_time"]
        ).first()
        if not existing:
            entry = TimetableEntry(**data)
            db.add(entry)
            print(f"  + Added timetable entry: {data['classroom_id']} {data['subject']} {data['start_time']}")
        else:
            print(f"  * Timetable entry for {data['classroom_id']} at {data['start_time']} exists")
    db.commit()

def seed_settings(db):
    print("Seeding settings preset...")
    setting = db.query(Setting).filter(Setting.key == "system_thresholds").first()
    if not setting:
        preset = "demo"
        setting = Setting(
            key="system_thresholds",
            preset=preset,
            value=PRESET_DEFAULTS[preset]
        )
        db.add(setting)
        db.commit()
        print(f"  + Initialized system_thresholds ({preset} preset)")
    else:
        print(f"  * System thresholds setting already exists (preset: {setting.preset})")

def purge_seed(db):
    print("Purging synthetic seed snapshots...")
    count = db.query(OccupancySnapshot).filter(OccupancySnapshot.data_source == "seed").delete()
    db.commit()
    print(f"  - Purged {count} seed snapshot rows.")

def main():
    parser = argparse.ArgumentParser(description="Seed Smart Classroom database")
    parser.add_argument("--classrooms", action="store_true", help="Seed ~12 classrooms across 4 blocks")
    parser.add_argument("--timetable", action="store_true", help="Seed timetable entries")
    parser.add_argument("--settings", action="store_true", help="Seed system settings presets")
    parser.add_argument("--all", action="store_true", help="Seed classrooms, timetable, and settings")
    parser.add_argument("--purge-seed", action="store_true", help="Purge synthetic seed data")

    args = parser.parse_args()
    db = SessionLocal()
    try:
        if args.purge_seed:
            purge_seed(db)
            return

        if args.all or args.classrooms:
            seed_classrooms(db)
        if args.all or args.timetable:
            seed_timetable(db)
        if args.all or args.settings or args.classrooms:
            seed_settings(db)
            
        print("Database seeding completed successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
