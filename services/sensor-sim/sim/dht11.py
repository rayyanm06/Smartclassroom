import random
from typing import Optional, Tuple

class Dht11Sensor:
    """
    DHT11 temperature & humidity physical model conforming to §12 and §17.
    - Continuous thermal & moisture dynamics
    - Quantised to whole integer °C and %RH on output
    - 1% sensor read failure rate (null)
    """
    def __init__(self, initial_temp: float = 30.0, ambient_temp: float = 32.0):
        self.internal_temp: float = initial_temp
        self.ambient_temp: float = ambient_temp
        self.internal_humidity: float = 60.0

    def tick(self, dt: float, people_count: int, ac_on: bool) -> None:
        """
        Advances thermal dynamics by dt seconds.
        dt in seconds.
        """
        minutes = dt / 60.0

        if ac_on:
            # AC relaxes towards 24.0°C with target cooling rate ~0.2°C/min
            target_temp = 24.0
            cooling_rate = 0.25 * (self.internal_temp - target_temp) * minutes
            self.internal_temp -= cooling_rate
            # AC lowers relative humidity towards 48-52%
            target_humidity = 50.0
            self.internal_humidity -= 0.3 * (self.internal_humidity - target_humidity) * minutes
        else:
            # Drifts towards ambient
            ambient_drift = 0.05 * (self.ambient_temp - self.internal_temp) * minutes
            self.internal_temp += ambient_drift
            # Humidity drifts towards 65%
            target_humidity = 65.0
            self.internal_humidity += 0.05 * (target_humidity - self.internal_humidity) * minutes

        # Human metabolic heat: +0.035°C/min per 10 people
        if people_count > 0:
            heat_gain = (0.035 * (people_count / 10.0)) * minutes
            self.internal_temp += heat_gain
            # Slight humidity increase from respiration
            self.internal_humidity += (0.02 * (people_count / 10.0)) * minutes

        # Add small micro-fluctuation noise (never large jumps)
        self.internal_temp += (random.random() - 0.5) * 0.02
        self.internal_humidity += (random.random() - 0.5) * 0.05

        # Clamp physically realistic ranges
        self.internal_temp = max(18.0, min(42.0, self.internal_temp))
        self.internal_humidity = max(30.0, min(95.0, self.internal_humidity))

    def read(self) -> Tuple[Optional[float], Optional[float]]:
        """
        Returns quantised output (whole integer °C and %RH)
        Simulates 1% read failure rate returning (None, None).
        """
        if random.random() < 0.01:
            return None, None

        quantised_temp = float(round(self.internal_temp))
        quantised_humidity = float(round(self.internal_humidity))
        return quantised_temp, quantised_humidity
