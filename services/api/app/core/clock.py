from datetime import datetime, timezone
import zoneinfo

TZ_IST = zoneinfo.ZoneInfo("Asia/Kolkata")
TZ_UTC = timezone.utc

class Clock:
    """Injectable clock for deterministic testing and live time resolution (§0 item 9)."""
    def now_utc(self) -> datetime:
        return datetime.now(TZ_UTC)

    def now_ist(self) -> datetime:
        return datetime.now(TZ_IST)

    def to_ist(self, dt: datetime) -> datetime:
        if dt.tzinfo is None:
            # Assume UTC if naive
            dt = dt.replace(tzinfo=TZ_UTC)
        return dt.astimezone(TZ_IST)

class FrozenClock(Clock):
    """Frozen clock for reproducible testing."""
    def __init__(self, fixed_utc: datetime):
        if fixed_utc.tzinfo is None:
            self._fixed_utc = fixed_utc.replace(tzinfo=TZ_UTC)
        else:
            self._fixed_utc = fixed_utc.astimezone(TZ_UTC)

    def now_utc(self) -> datetime:
        return self._fixed_utc

    def now_ist(self) -> datetime:
        return self._fixed_utc.astimezone(TZ_IST)

system_clock = Clock()
