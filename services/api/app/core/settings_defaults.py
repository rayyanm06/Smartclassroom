from typing import Dict, Any

PRESET_DEFAULTS: Dict[str, Dict[str, Any]] = {
    "production": {
        "camera_fresh_sec": 15,
        "sensor_fresh_sec": 30,
        "camera_empty_hold_sec": 30,
        "pir_recent_min": 15,
        "pre_start_min": 5,
        "post_end_min": 10,
        "grace_min": 10,
        "anomaly_min": 15,
        "idle_alert_min": 15,
        "idle_critical_min": 30,
        "precool_min": 15,
        "working_hours": "08:00-18:00",
        "underutilized_threshold": 0.30,
        "ac_kw_fallback": 1.5,
        "lights_kw_fallback": 0.3,
    },
    "demo": {
        "camera_fresh_sec": 15,
        "sensor_fresh_sec": 30,
        "camera_empty_hold_sec": 10,
        "pir_recent_min": 1,
        "pre_start_min": 5,
        "post_end_min": 2,
        "grace_min": 1,
        "anomaly_min": 2,
        "idle_alert_min": 1,
        "idle_critical_min": 3,
        "precool_min": 1,
        "working_hours": "08:00-18:00",
        "underutilized_threshold": 0.30,
        "ac_kw_fallback": 1.5,
        "lights_kw_fallback": 0.3,
    }
}
