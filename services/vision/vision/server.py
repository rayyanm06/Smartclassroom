import cv2
import time
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Generator

app = FastAPI(title="Smart Classroom Vision Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global registry populated by main.py
camera_sources: Dict[str, Any] = {}
camera_detectors: Dict[str, Any] = {}

def generate_mjpeg_stream(classroom_id: str) -> Generator[bytes, None, None]:
    source = camera_sources.get(classroom_id)
    detector = camera_detectors.get(classroom_id)

    while True:
        if not source or not source.is_connected():
            # Generate clean offline frame
            frame = 255 * np.ones((480, 640, 3), dtype=np.uint8)
            cv2.putText(frame, f"CAMERA {classroom_id} OFFLINE", (140, 240),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 200), 2)
        else:
            raw_frame = source.read_latest()
            if raw_frame is None:
                time.sleep(0.04)
                continue

            if detector:
                frame, count, conf = detector.annotate(raw_frame)
            else:
                frame = raw_frame

        # Encode to JPEG
        ret, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        if not ret:
            time.sleep(0.04)
            continue

        frame_bytes = buffer.tobytes()
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
        )
        time.sleep(0.04) # ~25 fps cap for network stream

@app.get("/health")
def health():
    return {"status": "healthy", "service": "vision"}

@app.get("/status")
def status():
    result = {}
    for cid, src in camera_sources.items():
        det = camera_detectors.get(cid)
        result[cid] = {
            "connected": src.is_connected(),
            "input_fps": src.get_fps(),
            "inference_latency_ms": det.last_latency_ms if det else 0.0,
            "last_people_count": det.last_count if det else 0,
        }
    return result

@app.get("/stream/{classroom_id}.mjpg")
def stream_mjpeg(classroom_id: str):
    if classroom_id not in camera_sources:
        raise HTTPException(status_code=404, detail=f"No camera configured for room '{classroom_id}'.")

    return StreamingResponse(
        generate_mjpeg_stream(classroom_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
