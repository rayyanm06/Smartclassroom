import random
from typing import Optional

class ApplianceManager:
    """
    Simulates classroom electrical appliances and behavioural forgetfulness (§17).
    """
    def __init__(self):
        self.ac_status: bool = False
        self.light_status: bool = False
        self.forgetfulness_remaining_s: float = 0.0

    def on_class_start(self):
        # Lights ON p=0.9, AC ON p=0.8
        if random.random() < 0.9:
            self.light_status = True
        if random.random() < 0.8:
            self.ac_status = True
        self.forgetfulness_remaining_s = 0.0

    def on_class_end(self):
        # With p=0.35 someone forgets AC/lights ON for 10-60 min
        if random.random() < 0.35 and (self.ac_status or self.light_status):
            forgotten_minutes = random.randint(10, 60)
            self.forgetfulness_remaining_s = forgotten_minutes * 60.0
        else:
            # Turned off normally
            self.ac_status = False
            self.light_status = False
            self.forgetfulness_remaining_s = 0.0

    def tick(self, dt: float):
        if self.forgetfulness_remaining_s > 0:
            self.forgetfulness_remaining_s -= dt
            if self.forgetfulness_remaining_s <= 0:
                # Finally someone turns them off after wandering in or patrol
                self.ac_status = False
                self.light_status = False

    def apply_command(self, device: str, command: str) -> bool:
        """Applies a remote command from the backend queue (§8, §17)."""
        new_state = (command.lower() == "on")
        changed = False
        if device == "ac":
            changed = (self.ac_status != new_state)
            self.ac_status = new_state
        elif device == "light":
            changed = (self.light_status != new_state)
            self.light_status = new_state
        return changed
