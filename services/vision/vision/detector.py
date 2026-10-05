import cv2
import time
import threading
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Tuple, Dict, Any
import numpy as np
import httpx
from ultralytics import YOLO

class YoloPersonDetector:
    """
    OpenCV + YOLO11n person detector with temporal smoothing/debouncing (Phase 8).
    - Detects ONLY person class (class 0) for occupancy counting (§16).
    - Strictly privacy-preserving: NO face recognition, NO identity, NO biometric storage (§16).
    - Temporal debouncing eliminates flicker from single-frame missed detections.
    - Periodically posts standardized camera telemetry to FastAPI backend (§7.1).
    """
    def __init__(
        self,
        classroom_id: str,
        camera_id: str = "camera",
        model_name: str = "yolo11n.pt",
        conf: float = 0.35,
        imgsz: int = 640,
        api_url: str = "http://localhost:8000",
        device_key: str = "dev-secret-device-key-2026",
        window_size: int = 5,
        report_interval_sec: float = 2.0,
    ):
        self.classroom_id = classroom_id
        self.camera_id = camera_id
        self.conf = conf
        self.imgsz = imgsz
        self.api_url = api_url
        self.device_key = device_key
        self.report_interval = report_interval_sec

        # Find model path
        root_model = Path(__file__).resolve().parent.parent.parent.parent / model_name
        local_model = Path(__file__).resolve().parent.parent / model_name
        if root_model.exists():
            model_target = str(root_model)
        elif local_model.exists():
            model_target = str(local_model)
        else:
            model_target = model_name

        print(f"[Detector] Loading YOLO model from '{model_target}' (conf={conf}, imgsz={imgsz})...")
        self.model = YOLO(model_target)
        print(f"[Detector] YOLO model loaded successfully for classroom '{classroom_id}'.")

        # Temporal smoothing buffer
        self.window_size = window_size
        self._history = deque(maxlen=window_size)
        self._lock = threading.Lock()

        # Telemetry metrics
        self.last_latency_ms: float = 0.0
        self.last_count: int = 0
        self.last_conf: float = 0.0
        self.smoothed_count: int = 0
        self.occupancy_status: str = "empty"
        self.fps: float = 0.0

        # Background threads
        self._running = False
        self.source = None
        self._infer_count: int = 0
        self.latest_annotated_frame: Optional[np.ndarray] = None
        self._report_thread = threading.Thread(target=self._report_worker, daemon=True)
        self._inference_thread = threading.Thread(target=self._inference_worker, daemon=True)

    def start(self, source=None):
        self.source = source
        self._running = True
        self._report_thread.start()
        if self.source:
            self._inference_thread.start()

    def get_latest_annotated_frame(self) -> Optional[np.ndarray]:
        with self._lock:
            if self.latest_annotated_frame is not None:
                return self.latest_annotated_frame.copy()
            return None

    def _inference_worker(self):
        """Continuously pulls latest frame from capture source and runs YOLO11n inference."""
        while self._running:
            if not self.source or not self.source.is_connected():
                time.sleep(0.1)
                continue
            raw_frame = self.source.read_latest()
            if raw_frame is None:
                time.sleep(0.04)
                continue

            try:
                annotated, _, _ = self.annotate(raw_frame)
                with self._lock:
                    self.latest_annotated_frame = annotated
            except Exception as e:
                time.sleep(0.05)
            time.sleep(0.03)

    def annotate(self, raw_frame: np.ndarray) -> Tuple[np.ndarray, int, float]:
        """
        Runs YOLO11n inference on raw_frame, updates smoothing buffer,
        and annotates bounding boxes.
        """
        t0 = time.time()
        # Filter ONLY class 0 ('person') per §16
        results = self.model.predict(
            raw_frame,
            classes=[0],
            conf=self.conf,
            imgsz=self.imgsz,
            verbose=False,
        )
        latency = (time.time() - t0) * 1000.0

        annotated = raw_frame.copy()
        boxes = results[0].boxes
        raw_count = len(boxes)

        self._infer_count += 1
        if self._infer_count == 1 or self._infer_count % 100 == 0:
            mean_val = float(np.mean(raw_frame))
            print(f"[Detector] #{self._infer_count} for {self.classroom_id}: in_shape={raw_frame.shape}, mean={mean_val:.1f} -> boxes={raw_count}, latency={latency:.1f}ms")

        confidences = []
        for box in boxes:
            c = float(box.conf[0])
            confidences.append(c)
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            # Draw sleek, privacy-safe bounding box (Green/Amber)
            color = (47, 158, 47) if c >= 0.5 else (76, 201, 242) # BGR
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

            # Label: Person + confidence (NO names, NO faces)
            label = f"Person {c:.2f}"
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            cv2.rectangle(annotated, (x1, y1 - th - 6), (x1 + tw + 4, y1), color, -1)
            cv2.putText(
                annotated,
                label,
                (x1 + 2, y1 - 4),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                (255, 255, 255),
                1,
                cv2.LINE_AA,
            )

        avg_conf = float(np.mean(confidences)) if confidences else 0.0

        # Update smoothing / debouncing window
        with self._lock:
            self._history.append(raw_count)
            # Median smoothing reduces transient single-frame noise
            smoothed = int(np.median(list(self._history)))
            self.smoothed_count = smoothed
            self.last_count = raw_count
            self.last_conf = round(avg_conf, 2)
            self.last_latency_ms = round(latency, 1)

            # Debounce occupancy state
            if self.smoothed_count > 0:
                self.occupancy_status = "occupied"
            else:
                # If all recent frames in window are 0 -> confirmed empty
                if all(c == 0 for c in self._history):
                    self.occupancy_status = "empty"

        # HUD Status Overlay at Top-Left
        badge_text = f"ROOM {self.classroom_id} | YOLO11n | {self.smoothed_count} PERSONS | {self.occupancy_status.upper()} | {latency:.0f}ms"
        (bw, bh), _ = cv2.getTextSize(badge_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(annotated, (10, 10), (20 + bw, 18 + bh), (17, 17, 17), -1)
        status_color = (68, 186, 47) if self.occupancy_status == "occupied" else (180, 180, 180)
        cv2.circle(annotated, (22, 14 + bh // 2), 4, status_color, -1)
        cv2.putText(
            annotated,
            badge_text,
            (32, 14 + bh // 2 + 4),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (255, 255, 255),
            1,
            cv2.LINE_AA,
        )

        return annotated, self.smoothed_count, self.last_conf

    def _report_worker(self):
        """Periodically reports debounced occupancy to backend API (§7.1)."""
        headers = {
            "X-Device-Key": self.device_key,
            "Content-Type": "application/json",
        }
        client = httpx.Client(timeout=2.0)

        while self._running:
            time.sleep(self.report_interval)
            with self._lock:
                count = self.smoothed_count
                status = self.occupancy_status
                conf = self.last_conf

            payload = {
                "classroom_id": self.classroom_id,
                "camera_id": self.camera_id,
                "people_detected": count,
                "occupancy_status": status,
                "confidence": conf,
                "source": "camera",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

            try:
                # Post to backend camera telemetry endpoint
                res = client.post(f"{self.api_url}/api/camera-data", json=payload, headers=headers)
                if res.status_code not in [200, 202]:
                    # Fallback to general sensor endpoint
                    client.post(f"{self.api_url}/api/classrooms/{self.classroom_id}/camera-telemetry", json={"people_count": count, "online": True}, headers=headers)
            except Exception:
                pass # Backend will retry on next cadence (§16)

    def stop(self):
        self._running = False
        if self._report_thread.is_alive():
            self._report_thread.join(timeout=2.0)
