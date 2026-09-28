import cv2
import time
import threading
from abc import ABC, abstractmethod
from typing import Optional, Union, Tuple
import numpy as np

class FrameSource(ABC):
    """Abstract frame source interface (§5, §16)."""
    @abstractmethod
    def read_latest(self) -> Optional[np.ndarray]:
        pass

    @abstractmethod
    def is_connected(self) -> bool:
        pass

    @abstractmethod
    def stop(self) -> None:
        pass

class VideoCaptureSource(FrameSource):
    """
    Robust video capture source supporting MJPEG URLs, RTSP, USB webcams, and files.
    Eliminates network stream queue lag by running a dedicated thread that
    only retains the single newest frame (§16 item 1).
    Includes auto-reconnect with exponential backoff (§16 item 2).
    """
    def __init__(self, source: Union[str, int], camera_id: str = "camera"):
        self.source = source
        self.camera_id = camera_id
        self._lock = threading.Lock()
        self._latest_frame: Optional[np.ndarray] = None
        self._connected: bool = False
        self._running: bool = False
        self._fps: float = 0.0
        self._last_read_ts: float = 0.0

        self._thread = threading.Thread(target=self._capture_worker, daemon=True)

    def start(self):
        self._running = True
        self._thread.start()

    def _capture_worker(self):
        backoff = 1.0
        max_backoff = 30.0

        while self._running:
            print(f"[Capture] Connecting to source {self.source}...")
            cap = cv2.VideoCapture(self.source)

            if not cap.isOpened():
                self._connected = False
                print(f"[Capture] Failed to open {self.source}. Backing off {backoff:.1f}s...")
                time.sleep(backoff)
                backoff = min(max_backoff, backoff * 1.5)
                continue

            # Connected successfully
            self._connected = True
            backoff = 1.0
            print(f"[Capture] Successfully connected to {self.source}")

            # Drain frames loop: always grab newest, discard intermediate buffer
            frame_times = []
            while self._running:
                ret, frame = cap.read()
                now = time.time()
                if not ret or frame is None:
                    print(f"[Capture] Stream disconnected from {self.source}.")
                    self._connected = False
                    break

                with self._lock:
                    self._latest_frame = frame
                    self._last_read_ts = now

                # Measure actual input FPS
                frame_times.append(now)
                frame_times = [t for t in frame_times if now - t <= 2.0]
                if len(frame_times) > 1:
                    self._fps = len(frame_times) / (frame_times[-1] - frame_times[0])

            cap.release()
            self._connected = False
            if self._running:
                time.sleep(backoff)

    def read_latest(self) -> Optional[np.ndarray]:
        with self._lock:
            if self._latest_frame is None:
                return None
            return self._latest_frame.copy()

    def is_connected(self) -> bool:
        # If no frame received in last 10s, consider disconnected
        if time.time() - self._last_read_ts > 10.0:
            return False
        return self._connected

    def get_fps(self) -> float:
        return round(self._fps, 1)

    def stop(self):
        self._running = False
        if self._thread.is_alive():
            self._thread.join(timeout=2.0)
