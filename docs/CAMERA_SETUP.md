# Phone Camera Setup Guide (Classroom A101)

This guide explains how to set up an Android or iOS smartphone as the optical telemetry camera for classroom `A101`.

---

## 1. Network Connectivity & Wi-Fi Isolation Warning

> [!WARNING]
> **College/Campus Wi-Fi Client Isolation:**
> Campus and enterprise Wi-Fi networks frequently enable **Client Isolation**, which strictly forbids communication between local devices (blocking phone-to-laptop traffic).

### Recommended Solutions:
1. **Phone Hotspot (Most Reliable):**
   - Enable Portable Hotspot on your smartphone.
   - Connect your laptop to the phone's Wi-Fi network.
   - The phone and laptop are now on the same subnet without firewall or client isolation restrictions.
2. **Laptop Mobile Hotspot:**
   - Enable Windows Mobile Hotspot in Network Settings.
   - Connect the phone to your laptop's hotspot.
3. **USB Tethering / ADB Port Forwarding (Zero Latency):**
   - Connect the phone via USB cable and enable USB Debugging.
   - Run: `adb forward tcp:8080 tcp:8080`
   - Access the stream at `http://127.0.0.1:8080/video`.

---

## 2. Phone Application Setup

### Option A: Android — "IP Webcam" (Recommended)
1. Install **IP Webcam** (by Pavel Khlebovich) from Google Play Store.
2. Open the app and configure settings:
   - **Video resolution:** 1280×720 or 640×480 (640×480 delivers highest FPS).
   - **Quality:** ~50%.
3. Scroll down and tap **Start Server**.
4. Note the displayed URL at the bottom of the screen (e.g. `http://192.168.43.1:8080`).
5. The video stream endpoint is `http://<PHONE_IP>:8080/video`.

### Option B: Android / iOS — "DroidCam"
1. Install **DroidCam** on phone.
2. Open app and note the Wi-Fi IP and Port (default 4747).
3. The video stream URL is `http://<PHONE_IP>:4747/video`.

### Option C: Built-in Laptop / USB Webcam (Testing Fallback)
- In `config/cameras.yaml`, set `source: 0` (or integer index of webcam).

---

## 3. Physical Placement Guidance

- **Positioning:** Mount phone securely on a tripod or fixed stand in a high front-corner position facing diagonally across student seating.
- **Lighting:** Avoid pointing the camera directly toward bright exterior windows to avoid backlight silhouettes.
- **Orientation:** Landscape orientation.
- **Power:** Keep phone plugged into a charger with battery-saver mode disabled and display timeout set to "Never while charging".

---

## 4. Configuration

Edit `services/vision/config/cameras.yaml`:
```yaml
cameras:
  - classroom_id: A101
    camera_id: phone-a101
    source: "http://192.168.43.1:8080/video"   # Replace with your phone IP or 0 for USB webcam
    roi: null                                  # Optional: [[x,y],...] polygon
    model: yolo11n.pt
    conf: 0.35
    imgsz: 640
```

---

## 5. Verification Gate (Phase 7 ⛔)

Once your phone is streaming:
1. Start the vision service:
   ```bash
   cd services/vision
   python -m vision.main
   ```
2. Open `http://localhost:8001/stream/508.mjpg` (or `http://localhost:8001/stream`) or the dashboard Camera Feed page.
3. Confirm live video latency is **< 1.0 second**.

