import random
from typing import Tuple

class PirSensor:
    """
    HC-SR501 PIR sensor model conforming to §17.
    - Poisson event arrivals based on people count
    - Output HIGH for hold_s (5-10s)
    - Output LOW with lockout_s (~3s)
    - Detects rising edge
    """
    def __init__(self, hold_s: float = 6.0, lockout_s: float = 3.0):
        self.hold_s = hold_s
        self.lockout_s = lockout_s
        self.is_high: bool = False
        self.hold_remaining: float = 0.0
        self.lockout_remaining: float = 0.0

    def tick(self, dt: float, people_count: int) -> Tuple[bool, bool]:
        """
        Advances PIR state by dt seconds.
        Returns (is_high, is_rising_edge).
        """
        was_high = self.is_high

        # 1. Update timers if active
        if self.hold_remaining > 0:
            self.hold_remaining -= dt
            if self.hold_remaining <= 0:
                self.is_high = False
                self.lockout_remaining = self.lockout_s

        elif self.lockout_remaining > 0:
            self.lockout_remaining -= dt
            self.is_high = False

        else:
            # Sensor is ready to trigger
            if people_count > 0:
                # Seated people move infrequently: rate ~ 0.05 + 0.02 * people_count per second
                trigger_prob_per_sec = min(0.95, 0.05 + (people_count * 0.025))
                # For dt interval: prob = 1 - (1 - p)^dt
                interval_prob = 1.0 - ((1.0 - trigger_prob_per_sec) ** dt)
                if random.random() < interval_prob:
                    self.is_high = True
                    self.hold_remaining = self.hold_s
            else:
                self.is_high = False

        is_rising_edge = (not was_high) and self.is_high
        return self.is_high, is_rising_edge
