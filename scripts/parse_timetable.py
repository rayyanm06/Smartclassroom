"""
Timetable Parser for Sardar Patel Institute of Technology (SPIT)
Computer Engineering Department - TE BTech (Divisions A, B, C, D)
Extracts structured timetable entries and unique rooms directly from timetable.pdf
"""

import json
import re
from pathlib import Path
import pypdf

PDF_PATH = Path(__file__).resolve().parent.parent / "timetable.pdf"

FACULTY_MAP = {
    "PBB": "Dr. P. B. Bhavathankar",
    "RK": "Prof. Reeta Koshy",
    "AVS": "Prof. Abhijeet Salunke",
    "AD": "Prof. Aniket Deo",
    "AT": "Dr. Anuj Tiwari",
    "PL": "Prof. Prathamesh Lokhande",
    "SB": "Prof. Sanket Borse",
    "JR": "Prof. Jyoti Ramteke",
    "AQ": "Prof. Azman Qureshi",
    "SK": "Prof. Swapnali Kurhade",
    "SBG": "Prof. Sunil Ghane",
    "VG": "Prof. Vrushali Gavitre",
    "RRS": "Prof. Rohan Shinde",
    "DB": "Prof. Dhanashri Borage",
    "YP": "Prof. Yogita Patil",
    "SRD": "Dr. Surekha Dholay",
    "SP": "Prof. Sohail Pathan",
    "ARN": "Prof. Aishwarya Nalwade",
    "AK": "Prof. Anshuman Kalbhore",
    "PD": "Prof. P. D.",
}

SUBJECT_MAP = {
    "DC": "Distributed Computing",
    "SE": "Software Engineering",
    "AI&SC": "Artificial Intelligence & Soft Computing",
    "AISC": "Artificial Intelligence & Soft Computing",
    "TOC": "Theory of Computation",
    "CNS": "Cryptography & Network Security",
    "DSA": "Data Structures & Algorithms",
    "IOT": "Internet of Things",
}

DAYS_X = [
    ("Monday", 150, 350, 0),
    ("Tuesday", 350, 550, 1),
    ("Wednesday", 550, 750, 2),
    ("Thursday", 750, 950, 3),
    ("Friday", 950, 1200, 4),
]

def clean_room(raw: str) -> str:
    r = raw.strip()
    # Normalize variants
    if r.startswith("Lab "):
        r = r.replace("Lab ", "").strip()
    if r == "509 old":
        r = "509"
    r = re.sub(r'\s+(Student|Circle|Slot|Faculty).*$', '', r).strip()
    return r

def parse_entry_text(text: str):
    """
    Parses strings like:
    - 'CNS/AVS/508'
    - 'SE Lab A2/RK/606-4'
    - 'MDM-II(DSA)/AT/601'
    - 'MDM II Lab(IOT)/PD/Batch 1/303'
    - 'DC Lab  B3/SBG/606-5'
    - 'AISC/JR/Lab 703'
    - 'AISC/ARN/609'
    """
    text = text.strip()
    if not text or text in ["SHORT BREAK", "LONG BREAK", "MDM Lab()", "Student Activity Slot", "Faculty Quality Circle Slot"]:
        return None

    # Check for Lab format: e.g. "SE Lab A2/RK/606-4" or "MDM II Lab(IOT)/PD/Batch 1/303"
    is_lab = "Lab" in text
    
    # Split by '/'
    parts = [p.strip() for p in text.split("/") if p.strip()]
    if len(parts) >= 3:
        raw_subj = parts[0]
        raw_fac = parts[1]
        raw_room = parts[-1]
        batch = None
        if len(parts) == 4 and "Batch" in parts[2]:
            batch = parts[2]

        # Extract subject code and batch if in subj
        subj_code = raw_subj
        if " Lab " in raw_subj:
            lab_parts = raw_subj.split(" Lab ")
            subj_code = lab_parts[0]
            batch = lab_parts[1].strip()
        elif " Lab/" in raw_subj:
            subj_code = raw_subj.replace(" Lab/", "")
        
        room = clean_room(raw_room)
        faculty = FACULTY_MAP.get(raw_fac, raw_fac)
        subject = SUBJECT_MAP.get(subj_code, subj_code)

        return {
            "subject_code": subj_code,
            "subject": subject,
            "faculty_code": raw_fac,
            "faculty": faculty,
            "room": room,
            "batch": batch,
            "type": "Lab" if is_lab else "Lecture",
        }
    
    return None

def extract_timetable():
    reader = pypdf.PdfReader(PDF_PATH)
    all_entries = []
    
    for page_idx in range(len(reader.pages)):
        div_name = f"Division-{chr(ord('A') + page_idx)}"
        page = reader.pages[page_idx]
        
        elements = []
        def visitor(text, cm, tm, fontDict, fontSize):
            t = text.strip()
            if t:
                elements.append((round(tm[4], 1), round(tm[5], 1), t))
        page.extract_text(visitor_text=visitor)
        
        # Sort by y then x
        elements.sort(key=lambda e: (e[1], e[0]))
        
        # Process each day column
        for day_name, x_min, x_max, day_idx in DAYS_X:
            day_elems = [e for e in elements if x_min <= e[0] < x_max and 170 <= e[1] <= 510]
            
            # Group into time slot bands
            # 9:00 - 11:00 (Labs) or 9:00 - 10:00 (Lectures)
            # 11:15 - 12:15
            # 13:15 - 14:15
            # 14:15 - 15:15
            # 15:15 - 16:15
            # 16:15 - 18:15 (Labs)
            for x, y, t in day_elems:
                parsed = parse_entry_text(t)
                if not parsed or not parsed["room"] or parsed["room"] in ["Batch"]:
                    continue
                
                # Determine time slot based on y coordinate and whether it's a lab
                start_time = "09:00"
                end_time = "10:00"
                
                if y < 255:
                    if parsed["type"] == "Lab":
                        start_time = "09:00"
                        end_time = "11:00"
                    else:
                        if y < 215:
                            start_time = "09:00"
                            end_time = "10:00"
                        else:
                            start_time = "10:00"
                            end_time = "11:00"
                elif 265 <= y < 305:
                    start_time = "11:15"
                    end_time = "12:15"
                elif 315 <= y < 345:
                    start_time = "13:15"
                    end_time = "14:15"
                elif 345 <= y < 380:
                    start_time = "14:15"
                    end_time = "15:15"
                elif 380 <= y < 420:
                    if parsed["type"] == "Lab":
                        start_time = "15:15"
                        end_time = "17:15"
                    else:
                        start_time = "15:15"
                        end_time = "16:15"
                elif 420 <= y <= 510:
                    if parsed["type"] == "Lab":
                        start_time = "16:15"
                        end_time = "18:15"
                    else:
                        start_time = "16:15"
                        end_time = "17:15"

                entry = {
                    "day": day_name,
                    "day_of_week": day_idx,
                    "start_time": start_time,
                    "end_time": end_time,
                    "subject": parsed["subject"],
                    "subject_code": parsed["subject_code"],
                    "room": parsed["room"],
                    "faculty": parsed["faculty"],
                    "faculty_code": parsed["faculty_code"],
                    "type": parsed["type"],
                    "division": div_name,
                    "batch": parsed["batch"],
                }
                all_entries.append(entry)

    return all_entries

if __name__ == "__main__":
    entries = extract_timetable()
    print(f"Total timetable entries parsed: {len(entries)}")
    
    unique_rooms = sorted(list(set(e["room"] for e in entries)))
    print(f"\nUnique extracted rooms ({len(unique_rooms)}):")
    for r in unique_rooms:
        types = set(e["type"] for e in entries if e["room"] == r)
        count = sum(1 for e in entries if e["room"] == r)
        print(f"  - Room {r:7s} | Types: {', '.join(types):15s} | Scheduled sessions: {count}")
    
    out_file = Path(__file__).resolve().parent.parent / "extracted_timetable.json"
    with open(out_file, "w") as f:
        json.dump({"rooms": unique_rooms, "entries": entries}, f, indent=2)
    print(f"\nSaved structured timetable to {out_file}")
