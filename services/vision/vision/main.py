import sys
import yaml
import uvicorn
from pathlib import Path

# Ensure services/vision directory is in sys.path
VISION_DIR = Path(__file__).resolve().parent.parent
if str(VISION_DIR) not in sys.path:
    sys.path.insert(0, str(VISION_DIR))

from vision.capture import VideoCaptureSource
from vision.detector import YoloPersonDetector
import vision.server as server

ROOT_CONFIG = Path(__file__).resolve().parent.parent.parent.parent / "cameras.yaml"
LOCAL_CONFIG = Path(__file__).resolve().parent.parent / "config" / "cameras.yaml"
CONFIG_PATH = ROOT_CONFIG if ROOT_CONFIG.exists() else LOCAL_CONFIG

def main():
    print(f"[Vision] Loading configuration from: {CONFIG_PATH}")
    with open(CONFIG_PATH, "r") as f:
        config = yaml.safe_load(f)

    for cam in config.get("cameras", []):
        room_id = str(cam["classroom_id"])
        source_val = cam["source"]
        camera_id = cam.get("camera_id", f"cam-{room_id.lower()}")
        print(f"[Vision] Configuring camera for room '{room_id}' with source '{source_val}' (camera_id={camera_id})")

        # 1. Start RTSP video capture thread
        src = VideoCaptureSource(source=source_val, camera_id=camera_id)
        src.start()
        server.camera_sources[room_id] = src

        # 2. Start YOLO11n person detector with temporal debouncing & telemetry reporting
        model_name = cam.get("model", "yolo11n.pt")
        conf = float(cam.get("conf", 0.35))
        imgsz = int(cam.get("imgsz", 640))
        detector = YoloPersonDetector(
            classroom_id=room_id,
            camera_id=camera_id,
            model_name=model_name,
            conf=conf,
            imgsz=imgsz,
        )
        detector.start(source=src)
        server.camera_detectors[room_id] = detector

    print(f"[Vision] Initialized {len(server.camera_sources)} camera stream sources and {len(server.camera_detectors)} detectors.")
    uvicorn.run(server.app, host="0.0.0.0", port=8001, log_level="info")

if __name__ == "__main__":
    main()
