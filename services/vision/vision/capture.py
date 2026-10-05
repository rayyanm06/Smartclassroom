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
        self._frame_count: int = 0

    def start(self):
        self._running = True
        self._thread.start()

    def _capture_worker(self):
        backoff = 2.0
        max_backoff = 5.0

        while self._running:
            print(f"[Capture] Connecting to source {self.source}...", flush=True)
            if isinstance(self.source, str) and (self.source.startswith("rtsp://") or self.source.startswith("http://")):
                cap = cv2.VideoCapture(
                    self.source,
                    cv2.CAP_FFMPEG,
                    [cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 3000, cv2.CAP_PROP_READ_TIMEOUT_MSEC, 3000]
                )
            else:
                cap = cv2.VideoCapture(self.source)

            if not cap.isOpened():
                self._connected = False
                print(f"[Capture] RTSP not responding on {self.source}. Retrying in {backoff:.1f}s (ensure app is open on iPhone)...", flush=True)
                time.sleep(backoff)
                continue

            # Connected successfully
            self._connected = True
            backoff = 2.0
            print(f"[Capture] Successfully connected to {self.source}", flush=True)

            # Drain frames loop: always grab newest, discard intermediate buffer
            frame_times = []
            while self._running:
                ret, frame = cap.read()
                now = time.time()
                if not ret or frame is None:
                    print(f"[Capture] Stream disconnected from {self.source}.")
                    self._connected = False
                    break

                self._frame_count += 1
                if self._frame_count == 1 or self._frame_count % 300 == 0:
                    mean_val = float(np.mean(frame))
                    print(f"[Capture] Frame #{self._frame_count} from {self.source}: shape={frame.shape}, dtype={frame.dtype}, mean={mean_val:.1f}")

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
