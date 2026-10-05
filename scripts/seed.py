import argparse
import sys
from pathlib import Path
from datetime import time, date, datetime, timezone
import json

ROOT_DIR = Path(__file__).resolve().parent.parent
API_DIR = ROOT_DIR / "services" / "api"
sys.path.insert(0, str(API_DIR))
sys.path.insert(0, str(ROOT_DIR))

from app.core.db import SessionLocal
from app.models.classroom import Classroom, ClassroomState
from app.models.timetable import TimetableEntry
from app.models.setting import Setting
from app.models.snapshot import OccupancySnapshot
from app.models.sensor import SensorReading
from app.models.alert import Alert
from app.core.settings_defaults import PRESET_DEFAULTS
from scripts.parse_timetable import extract_timetable

# Authentic classrooms extracted directly from timetable.pdf
CLASSROOMS_SEED = [
    # Floor 0 (Ground Floor)
    {"id": "002", "name": "Lecture Hall 002", "building": "Academic Block", "floor": 0, "capacity": 75, "room_type": "lecture", "has_camera": True, "has_pir": True, "has_dht": True, "ac_rated_kw": 2.2, "lights_rated_kw": 0.4},
    # Floor 2
    {"id": "203", "name": "Classroom 203", "building": "Academic Block", "floor": 2, "capacity": 60, "room_type": "lecture", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.8, "lights_rated_kw": 0.3},
    # Floor 3
    {"id": "303", "name": "IoT & Embedded Lab 303", "building": "Academic Block", "floor": 3, "capacity": 35, "room_type": "lab", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 2.0, "lights_rated_kw": 0.4},
    {"id": "305", "name": "Classroom 305", "building": "Academic Block", "floor": 3, "capacity": 50, "room_type": "lecture", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.5, "lights_rated_kw": 0.3},
    # Floor 5
    {"id": "505", "name": "DSA & Computing Lab 505", "building": "Academic Block", "floor": 5, "capacity": 35, "room_type": "lab", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 2.0, "lights_rated_kw": 0.4},
    {"id": "508", "name": "Main Lecture Hall 508", "building": "Academic Block", "floor": 5, "capacity": 80, "room_type": "lecture", "has_camera": True, "has_pir": True, "has_dht": True, "ac_rated_kw": 2.5, "lights_rated_kw": 0.5},
    {"id": "509", "name": "Distributed Systems Lab 509", "building": "Academic Block", "floor": 5, "capacity": 35, "room_type": "lab", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 2.0, "lights_rated_kw": 0.4},
    # Floor 6
    {"id": "601", "name": "Classroom 601", "building": "Academic Block", "floor": 6, "capacity": 50, "room_type": "lecture", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.5, "lights_rated_kw": 0.3},
    {"id": "603-2", "name": "Computing Lab 603-2", "building": "Academic Block", "floor": 6, "capacity": 30, "room_type": "lab", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.8, "lights_rated_kw": 0.35},
    {"id": "603-3", "name": "Software Lab 603-3", "building": "Academic Block", "floor": 6, "capacity": 30, "room_type": "lab", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.8, "lights_rated_kw": 0.35},
    {"id": "603-7", "name": "AISC Lab 603-7", "building": "Academic Block", "floor": 6, "capacity": 30, "room_type": "lab", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.8, "lights_rated_kw": 0.35},
    {"id": "604", "name": "DC Systems Lab 604", "building": "Academic Block", "floor": 6, "capacity": 35, "room_type": "lab", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 2.0, "lights_rated_kw": 0.4},
    {"id": "606-4", "name": "Software Eng Lab 606-4", "building": "Academic Block", "floor": 6, "capacity": 30, "room_type": "lab", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.8, "lights_rated_kw": 0.35},
    {"id": "606-5", "name": "Networks Lab 606-5", "building": "Academic Block", "floor": 6, "capacity": 30, "room_type": "lab", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.8, "lights_rated_kw": 0.35},
    {"id": "607-B", "name": "AI Lab 607-B", "building": "Academic Block", "floor": 6, "capacity": 30, "room_type": "lab", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.8, "lights_rated_kw": 0.35},
    {"id": "608", "name": "Software Lab 608", "building": "Academic Block", "floor": 6, "capacity": 35, "room_type": "lab", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.8, "lights_rated_kw": 0.35},
    {"id": "609", "name": "Seminar Room 609", "building": "Academic Block", "floor": 6, "capacity": 45, "room_type": "seminar", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 2.0, "lights_rated_kw": 0.4},
    # Floor 7
    {"id": "702-A", "name": "Security Lab 702-A", "building": "Academic Block", "floor": 7, "capacity": 30, "room_type": "lab", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.8, "lights_rated_kw": 0.35},
    {"id": "702-B", "name": "Networks Lab 702-B", "building": "Academic Block", "floor": 7, "capacity": 30, "room_type": "lab", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.8, "lights_rated_kw": 0.35},
    {"id": "702-C", "name": "Intelligence Lab 702-C", "building": "Academic Block", "floor": 7, "capacity": 30, "room_type": "lab", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.8, "lights_rated_kw": 0.35},
    {"id": "703", "name": "AISC Advanced Lab 703", "building": "Academic Block", "floor": 7, "capacity": 35, "room_type": "lab", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 2.0, "lights_rated_kw": 0.4},
    {"id": "703-A", "name": "Cryptography Lab 703-A", "building": "Academic Block", "floor": 7, "capacity": 30, "room_type": "lab", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.8, "lights_rated_kw": 0.35},
    {"id": "703-B", "name": "Systems Lab 703-B", "building": "Academic Block", "floor": 7, "capacity": 30, "room_type": "lab", "has_camera": False, "has_pir": True, "has_dht": True, "ac_rated_kw": 1.8, "lights_rated_kw": 0.35},
]

def purge_old_data(db):
    print("Purging old mock data...")
    # Delete old timetable entries
    db.query(TimetableEntry).delete()
    # Delete old alerts
    db.query(Alert).delete()
    # Delete old sensor readings
    db.query(SensorReading).delete()
    # Delete old snapshots
    db.query(OccupancySnapshot).delete()
    # Delete old classroom states and classrooms
    db.query(ClassroomState).delete()
    db.query(Classroom).delete()
    db.commit()
    print("  - Cleared old tables cleanly.")

def seed_classrooms(db):
    print("Seeding authentic SPIT classrooms...")
    for data in CLASSROOMS_SEED:
        existing = db.get(Classroom, data["id"])
        if not existing:
            room = Classroom(**data)
            state = ClassroomState(
                classroom_id=data["id"],
                occupancy_state="EMPTY",
                confidence_level="high",
                reasons=["Classroom provisioned from SPIT timetable.pdf"],
                idle_minutes=0,
                ac_status=False,
                light_status=False,
                camera_online=data["has_camera"],
                sensor_online=True,
            )
            room.state = state
            db.add(room)
            print(f"  + Added classroom {data['id']} ({data['name']})")
        else:
            print(f"  * Classroom {data['id']} already exists")
    db.commit()

def seed_timetable(db):
    print("Extracting and seeding timetable from timetable.pdf...")
    parsed_entries = extract_timetable()
    
    # Consolidate multiple divisions sharing the same room at the same time
    merged_map = {}
    for entry in parsed_entries:
        room_id = entry["room"]
        # Ensure room is provisioned
        if not any(c["id"] == room_id for c in CLASSROOMS_SEED):
            continue
            
        sh, sm = map(int, entry["start_time"].split(":"))
        eh, em = map(int, entry["end_time"].split(":"))
        key = (room_id, entry["day_of_week"], time(sh, sm))
        
        if key not in merged_map:
            merged_map[key] = {
                "classroom_id": room_id,
                "subject": entry["subject"],
                "faculty": entry["faculty"],
                "day_of_week": entry["day_of_week"],
                "start_time": time(sh, sm),
                "end_time": time(eh, em),
                "class_type": entry["type"].lower(),
                "division": entry["division"],
                "batch": entry["batch"],
            }
        else:
            existing = merged_map[key]
            # Merge division
            if entry["division"] not in existing["division"]:
                existing["division"] += f", {entry['division']}"

    added = 0
    for key, data in merged_map.items():
        entry = TimetableEntry(**data)
        db.add(entry)
        added += 1

    db.commit()
    print(f"  + Seeded {added} consolidated timetable sessions from timetable.pdf.")

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

def main():
    parser = argparse.ArgumentParser(description="Seed Smart Classroom database with SPIT timetable")
    parser.add_argument("--purge", action="store_true", help="Purge old mock classrooms and data")
    parser.add_argument("--classrooms", action="store_true", help="Seed authentic classrooms")
    parser.add_argument("--timetable", action="store_true", help="Seed timetable entries")
    parser.add_argument("--settings", action="store_true", help="Seed system settings presets")
    parser.add_argument("--all", action="store_true", help="Clean purge and seed classrooms, timetable, settings")

    args = parser.parse_args()
    db = SessionLocal()
    try:
        if args.purge or args.all:
            purge_old_data(db)

        if args.all or args.classrooms:
            seed_classrooms(db)
        if args.all or args.timetable:
            seed_timetable(db)
        if args.all or args.settings:
            seed_settings(db)
            
        print("\nDatabase seeding completed successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
