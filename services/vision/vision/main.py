import yaml
import uvicorn
from pathlib import Path
from vision.capture import VideoCaptureSource
import vision.server as server

CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "cameras.yaml"

def main():
    with open(CONFIG_PATH, "r") as f:
        config = yaml.safe_load(f)

    for cam in config.get("cameras", []):
        room_id = cam["classroom_id"]
        source_val = cam["source"]
        src = VideoCaptureSource(source=source_val, camera_id=cam.get("camera_id", f"cam-{room_id.lower()}"))
        src.start()
        server.camera_sources[room_id] = src

    print(f"[Vision] Initialized {len(server.camera_sources)} camera stream sources.")
    uvicorn.run(server.app, host="0.0.0.0", port=8001, log_level="info")

if __name__ == "__main__":
    main()
