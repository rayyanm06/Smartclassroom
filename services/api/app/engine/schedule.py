from datetime import datetime, time, timedelta
from typing import Optional, List, Tuple
from app.core.clock import TZ_IST

def time_to_minutes(t: time) -> int:
    """Converts a datetime.time to minutes from midnight."""
    return t.hour * 60 + t.minute

def check_time_overlap(
    start_a: time, end_a: time,
    start_b: time, end_b: time
) -> bool:
    """
    Checks if time window [start_a, end_a) overlaps with [start_b, end_b).
    Touching boundary points (back-to-back classes, e.g. 10:00-11:00 and 11:00-12:00)
    do NOT overlap (§10).
    """
    a_start = time_to_minutes(start_a)
    a_end = time_to_minutes(end_a)
    b_start = time_to_minutes(start_b)
    b_end = time_to_minutes(end_b)

    return max(a_start, b_start) < min(a_end, b_end)

def is_expected(
    entries: List[any],
    now_ist: datetime,
    pre_start_min: int = 5,
    post_end_min: int = 10,
) -> Tuple[bool, Optional[any]]:
    """
    Determines if a timetable entry covers now_ist within the buffer window:
    [start - pre_start_min, end + post_end_min] (§8).
    """
    dow = now_ist.weekday() # 0=Mon ... 6=Sun
    now_minutes = now_ist.hour * 60 + now_ist.minute

    for entry in entries:
        if entry.day_of_week != dow:
            continue
        
        # Check validity date range if defined
        current_date = now_ist.date()
        if entry.valid_from and current_date < entry.valid_from:
            continue
        if entry.valid_to and current_date > entry.valid_to:
            continue

        start_min = time_to_minutes(entry.start_time) - pre_start_min
        end_min = time_to_minutes(entry.end_time) + post_end_min

        if start_min <= now_minutes <= end_min:
            return True, entry

    return False, None

def get_active_entry(entries: List[any], now_ist: datetime) -> Optional[any]:
    """Returns the timetable entry currently in session at now_ist."""
    dow = now_ist.weekday()
    now_time = now_ist.time()

    for entry in entries:
        if entry.day_of_week != dow:
            continue
        current_date = now_ist.date()
        if entry.valid_from and current_date < entry.valid_from:
            continue
        if entry.valid_to and current_date > entry.valid_to:
            continue

        if entry.start_time <= now_time < entry.end_time:
            return entry

    return None

def get_next_entry(entries: List[any], now_ist: datetime) -> Optional[any]:
    """Returns the subsequent scheduled entry on the same day after now_ist."""
    dow = now_ist.weekday()
    now_time = now_ist.time()

    future_entries = []
    for entry in entries:
        if entry.day_of_week != dow:
            continue
        current_date = now_ist.date()
        if entry.valid_from and current_date < entry.valid_from:
            continue
        if entry.valid_to and current_date > entry.valid_to:
            continue

        if entry.start_time >= now_time:
            future_entries.append(entry)

    if not future_entries:
        return None

    # Sort by start_time
    future_entries.sort(key=lambda e: time_to_minutes(e.start_time))
    return future_entries[0]
