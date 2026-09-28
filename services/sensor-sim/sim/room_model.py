import random
from datetime import datetime, timezone
from typing import Optional, List
from sim.pir import PirSensor
from sim.dht11 import Dht11Sensor
from sim.appliances import ApplianceManager
from sim.provider import SensorEvent

class SimulatedRoom:
    """
    Simulation model for a single classroom sensor node (§17).
    """
    def __init__(
        self,
        room_id: str,
        device_id: str,
        capacity: int = 40,
        mode: str = "auto",
        ambient_temp: float = 32.0,
        heartbeat_interval_sec: float = 10.0,
    ):
        self.room_id = room_id
        self.device_id = device_id
        self.capacity = capacity
        self.mode = mode # auto | follow_camera | force_occupied | force_empty
        self.heartbeat_interval_sec = heartbeat_interval_sec

        self.pir = PirSensor()
        self.dht = Dht11Sensor(initial_temp=ambient_temp - 2.0, ambient_temp=ambient_temp)
        self.appliances = ApplianceManager()

        self.simulated_people: int = 0
        self.heartbeat_timer: float = random.uniform(0.0, heartbeat_interval_sec)
        self.offline_remaining_s: float = 0.0

        # State tracking for class transitions
        self.in_scheduled_class: bool = False

    def force_offline(self, seconds: float):
        self.offline_remaining_s = seconds

    def set_mode(self, new_mode: str):
        self.mode = new_mode

    def update_occupancy(self, timetable_in_session: bool, camera_count: Optional[int] = None):
        """Calculates expected people count based on mode and schedule."""
        if self.mode == "force_occupied":
            self.simulated_people = max(5, int(self.capacity * 0.75))
        elif self.mode == "force_empty":
            self.simulated_people = 0
        elif self.mode == "follow_camera" and camera_count is not None:
            self.simulated_people = camera_count
        elif self.mode == "auto":
            if timetable_in_session:
                if not self.in_scheduled_class:
                    # Class just started!
                    self.appliances.on_class_start()
                    self.in_scheduled_class = True
                # Attendance 60-95%
                target_pct = random.uniform(0.60, 0.95)
                self.simulated_people = max(1, int(self.capacity * target_pct))
            else:
                if self.in_scheduled_class:
                    # Class just ended!
                    self.appliances.on_class_end()
                    self.in_scheduled_class = False
                # Between classes: low random activity (0 to 3 people or 0)
                self.simulated_people = 0 if random.random() < 0.8 else random.randint(1, 3)

    def tick(self, dt: float) -> Optional[SensorEvent]:
        """
        Advances the room simulation by dt seconds.
        Returns a SensorEvent if heartbeat is due or on PIR rising edge, else None.
        """
        if self.offline_remaining_s > 0:
            self.offline_remaining_s -= dt
            return None # Simulated device is offline, emits nothing

        # Update sensors and physical models
        is_high, is_rising_edge = self.pir.tick(dt, self.simulated_people)
        self.appliances.tick(dt)
        self.dht.tick(dt, self.simulated_people, self.appliances.ac_status)

        self.heartbeat_timer += dt
        is_heartbeat = self.heartbeat_timer >= self.heartbeat_interval_sec

        # Trigger event if rising edge or heartbeat
        if is_rising_edge or is_heartbeat:
            if is_heartbeat:
                self.heartbeat_timer = 0.0

            temp, hum = self.dht.read()
            now_iso = datetime.now(timezone.utc).isoformat()

            event = SensorEvent(
                classroom_id=self.room_id,
                device_id=self.device_id,
                pir_motion=is_high,
                event="motion" if is_rising_edge else None,
                temperature=temp,
                humidity=hum,
                ac_status=self.appliances.ac_status,
                light_status=self.appliances.light_status,
                wifi_rssi=random.randint(-68, -48),
                source="simulation",
                timestamp=now_iso,
            )
            return event

        return None
