# SMART CLASSROOM OCCUPANCY & RESOURCE MANAGEMENT SYSTEM
### Implementation Spec v1 — for Antigravity agent

Save this file in the repo as `docs/SPEC.md`. It is the single source of truth. The kickoff prompt to paste into Antigravity is at the very end (§20).

---

## 0. AGENT OPERATING RULES (read first)

1. Read this whole spec before doing anything.
2. **Phase 0 is planning only.** Inspect the repo and return the report described in §18 (sections A–J). Do not write code, install packages or modify files in Phase 0. Then **stop and wait for approval**.
3. After approval, work **one phase at a time** (§19). At the end of each phase: run the tests, run the app, report exactly what you verified, commit as `phase-N: <summary>`.
4. Stop at every gate marked ⛔ in §19 (they need a human, a phone, or a decision). Other phases may continue automatically as long as their acceptance criteria pass.
5. Do NOT replace existing architecture. Extend it. Reuse existing components, routing and styling where sensible. Do not break existing functionality.
6. Decisions in §2 are **locked**. Do not re-ask them. For anything this spec does not cover, choose the simplest option and record it in `docs/DECISIONS.md` (one line: decision + reason).
7. **Never present fabricated data as real.** Seeded/synthetic data must be stored with `source='seed'` and labelled in the UI. Simulated sensor data is `source='simulation'`. The camera is never simulated.
8. Do not add dependencies beyond those in §3 without noting it in `docs/DECISIONS.md`.
9. Business logic (occupancy, energy, alerts) lives in **pure, unit-tested functions** with an injectable clock. No logic in route handlers or React components.

---

## 1. PRODUCT INTENT

A real operational classroom management platform for a college. It fuses three independent evidence sources per classroom:

- **Camera** → people count (YOLO person detection, no identity)
- **ESP32/PIR/DHT11** → motion, temperature, humidity, AC/light state
- **Timetable** → expected occupancy

…into one occupancy state per room, then drives analytics, energy-saving recommendations, alerts, a watchman task list and a simple prediction model.

**Today:** phone camera + sensor simulator + timetable.
**Later:** dedicated camera + ESP32 + PIR + DHT11 + relay. Same backend, same APIs, same dashboard.

---

## 2. LOCKED DECISIONS

| # | Decision |
|---|---|
| D1 | Monorepo with 4 independently runnable services: `web`, `api`, `vision`, `sensor-sim`. |
| D2 | **Producers push, consumers read.** Camera service and sensor simulator/ESP32 are HTTP producers. The backend never knows or cares whether data is real or simulated (only stores `source` for display/audit). |
| D3 | The dashboard/backend never talk to hardware. Only `vision` talks to the camera; only `sensor-sim`/ESP32 produce sensor data. |
| D4 | **Only one real camera exists (phone → classroom `A101`).** All other rooms have `has_camera=false`; their occupancy = PIR + timetable, people count shown as `—`. The camera is never simulated for other rooms. The engine must handle rooms without a camera. |
| D5 | Timezone for all timetable logic: `Asia/Kolkata`. Store timestamps in UTC. |
| D6 | Live camera view = annotated MJPEG stream served by the `vision` service and embedded with `<img>`. Frames are never stored, never sent to the backend, never written to disk. |
| D7 | Frontend gets data by **polling** (every 3 s for live views, 15 s for analytics). No WebSocket in v1. Use TanStack Query (the one allowed extra frontend dependency). |
| D8 | Appliance control is a **command queue**: dashboard/watchman creates a command → backend stores it → device polls for pending commands → device acks. The simulator uses this exactly as the ESP32 will. |
| D9 | Ingest endpoints are protected by an `X-Device-Key` header (from `.env`). Dashboard endpoints have no login in v1 (roles are just two views: Admin and Watchman). |
| D10 | Thresholds (idle minutes, PIR window, etc.) are stored in a `settings` table with two presets: **Production** and **Demo** (short times, so alerts fire within minutes in a live demo). |
| D11 | Prediction target = **probability the room is occupied in an hourly slot** (all rooms) plus **expected people count** (camera rooms only). Model must be interpretable (Logistic/Ridge/shallow tree), with a historical-average baseline fallback. |
| D12 | DHT11 realism: temperature resolution 1 °C, humidity 1 %RH, ±2 °C / ±5 %RH accuracy, occasional failed read (`null`). The API accepts floats and nulls so a better sensor works later. |

---

## 3. TECHNOLOGY

- **web:** React, TypeScript, Vite, Tailwind CSS, React Router, Recharts, Lucide React, TanStack Query. Fonts self-hosted via `@fontsource` (no CDN — college Wi-Fi can be unreliable).
- **api:** Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.x, Alembic, PyMySQL, APScheduler (or an asyncio background task), pytest.
- **db:** MySQL 8 (`docker-compose.yml` provided for it; also works with a local install). Tests may use SQLite in-memory — keep models portable and note any dialect gaps.
- **vision:** Python, OpenCV, Ultralytics YOLO (`yolo11n.pt` default, configurable), FastAPI for the preview/status server, `httpx` for posting.
- **sensor-sim:** Python, `httpx`, PyYAML, small FastAPI control server.
- **ml:** Pandas, NumPy, scikit-learn (inside `api/app/ml/`).

If the repo already contains a frontend/backend, match its versions and conventions; the layout below is a target, not a mandate to move files.

---

## 4. REPOSITORY LAYOUT

```text
smart-classroom/
├─ apps/web/                     # React + TS + Vite
│  └─ src/
│     ├─ app/                    # router, layout shell, providers
│     ├─ pages/                  # one folder per route
│     ├─ components/             # ui/ (design system) + feature components
│     ├─ services/api.ts         # typed client; mock adapter behind VITE_USE_MOCKS
│     ├─ services/mocks/         # Phase 2 only, removed/disabled once API is live
│     ├─ types/                  # mirrors API schemas (later generated from OpenAPI)
│     └─ lib/                    # time, format, state→style maps
├─ services/api/
│  └─ app/
│     ├─ main.py
│     ├─ core/                   # config, db, security (device key), clock
│     ├─ models/                 # SQLAlchemy
│     ├─ schemas/                # Pydantic
│     ├─ routers/                # thin HTTP layer
│     ├─ engine/                 # PURE logic: occupancy.py, energy.py, alerts.py, schedule.py
│     ├─ services/               # orchestration: evaluator loop, snapshot writer, analytics
│     ├─ ml/                     # features.py, train.py, predict.py
│     └─ tests/
├─ services/vision/
│  ├─ vision/                    # capture.py, detector.py, smoothing.py, poster.py, server.py, main.py
│  ├─ config/cameras.yaml
│  └─ tests/
├─ services/sensor-sim/
│  ├─ sim/                       # provider.py, room_model.py, pir.py, dht11.py, appliances.py, control.py, main.py
│  ├─ config/rooms.yaml
│  └─ tests/
├─ firmware/esp32/               # README + stub sketch showing the identical POST (Phase 15)
├─ scripts/                      # seed.py, make_demo_timetable.py, smoke.py
├─ docs/                         # SPEC.md, DECISIONS.md, API.md, ESP32_CONTRACT.md, CAMERA_SETUP.md
├─ docker-compose.yml            # MySQL (+ adminer optional)
├─ .env.example
└─ README.md                     # exact run commands for every service
```

Ports: web `5173`, api `8000`, vision `8001`, sensor-sim `8002`, MySQL `3306`.

---

## 5. PROVIDER ABSTRACTION (critical)

Every producer emits one of two **standard events**. The backend consumes only these.

- `SensorEvent` → `POST /api/sensor-data`
- `CameraEvent` → `POST /api/camera-detections`

Producer side, each service has a provider interface so the source can be swapped by config:

```text
sensor-sim/sim/provider.py    SensorProvider (abstract: next_reading(room) -> SensorEvent)
                              SimulationProvider   ← implemented now
                              (Esp32 = real firmware, lives in firmware/esp32/, same JSON)

vision/vision/capture.py      FrameSource (abstract: read_latest() -> frame|None)
                              MjpegSource / RtspSource / UsbSource   ← phone via URL
                              (later: DedicatedCameraSource = just another RTSP URL)
```

Rule: swapping "Simulation → ESP32" or "Phone → dedicated camera" must require **zero** changes in `api` or `web`. Add an automated test proving the API accepts a payload with `source="esp32"` identically to `source="simulation"`.

---

## 6. DATA MODEL

All tables: `id` PK, `created_at`. Times are UTC unless noted.

**classrooms**
`id` (string PK, e.g. `A101`), `name`, `building`, `floor`, `capacity`, `room_type` (lecture/lab/seminar), `has_camera`, `has_pir`, `has_dht`, `ac_rated_kw` (default 1.5), `lights_rated_kw` (default 0.3), `active`.

**timetable_entries**
`id`, `classroom_id` FK, `subject`, `faculty`, `day_of_week` (0=Mon…6=Sun), `start_time`, `end_time` (local IST `TIME`), `class_type` (lecture/lab/tutorial/exam/other), `valid_from`, `valid_to` (nullable). Constraint: no overlapping entries for the same classroom/day (API returns 409 with the conflicting entry).

**sensor_readings** (raw, retention 7 days via scheduled purge)
`id`, `classroom_id`, `device_id` (nullable), `pir_motion` (bool), `event` (nullable: `"motion"`), `temperature` (float, nullable), `humidity` (float, nullable), `ac_status` (bool), `light_status` (bool), `wifi_rssi` (nullable), `source` (`simulation`|`esp32`), `device_timestamp` (nullable), `received_at`.

**camera_detections** (raw, retention 7 days)
`id`, `classroom_id`, `camera_id`, `people_detected` (int), `confidence` (float 0–1), `source` (`camera`), `fps` (nullable), `device_timestamp`, `received_at`. **No boxes, images, embeddings or IDs are stored.**

**classroom_state** (one row per classroom; hot read model updated by the evaluator)
`classroom_id` PK, `occupancy_state`, `confidence_level` (high/medium/low), `reasons` (JSON list of strings), `people_count` (nullable), `expected_occupancy` (bool), `timetable_entry_id` (nullable), `last_camera_at`, `last_camera_count`, `last_sensor_at`, `last_motion_at`, `last_presence_at`, `idle_minutes`, `temperature`, `humidity`, `ac_status`, `light_status`, `camera_online`, `sensor_online`, `updated_at`.

**occupancy_snapshots** (written every 60 s per classroom + on state change; basis for analytics/prediction)
`id`, `classroom_id`, `ts`, `occupancy_state`, `people_count` (nullable), `expected_occupancy`, `pir_active`, `temperature`, `humidity`, `ac_on`, `light_on`, `idle_minutes`, `data_source` (`live`|`seed`).

**alerts**
`id`, `classroom_id`, `type` (`ENERGY_AC_IDLE`, `ENERGY_LIGHTS_IDLE`, `UNEXPECTED_OCCUPANCY`, `OCCUPANCY_ANOMALY`, `SENSOR_OFFLINE`, `CAMERA_OFFLINE`), `severity` (info/warning/critical), `headline`, `detail`, `status` (open/acknowledged/resolved), `first_seen`, `last_seen`, `resolved_at`, `acknowledged_at`. Uniqueness: at most one non-resolved alert per `(classroom_id, type)`.

**device_commands**
`id`, `classroom_id`, `device` (`ac`|`light`), `command` (`on`|`off`), `status` (pending/acked/expired), `requested_by` (`admin`|`watchman`|`system`), `created_at`, `acked_at`. Pending commands expire after 10 min.

**settings**
key/value JSON + `preset` (`production`|`demo`). Defaults in §9.

**prediction_models**
`id`, `trained_at`, `algorithm`, `n_rows`, `synthetic_fraction`, `metrics` (JSON), `feature_importance` (JSON), `artifact_path`.

Indexes: `(classroom_id, received_at)` on raw tables, `(classroom_id, ts)` on snapshots, `(status)` on alerts.

---

## 7. API CONTRACT

All JSON. Errors: `{ "detail": "..." }`. Unknown `classroom_id` on ingest → `404` (no auto-provisioning). Missing/invalid `X-Device-Key` on ingest → `401`. Timestamps ISO-8601 UTC; if `timestamp` is omitted (ESP32 without NTP) the server uses receive time.

### 7.1 Ingest (device-facing — this is the stable contract)

**POST `/api/sensor-data`** — simulator now, ESP32 later
```json
{
  "classroom_id": "A101",
  "device_id": "esp32-a101",
  "pir_motion": true,
  "event": "motion",
  "temperature": 28.0,
  "humidity": 61,
  "ac_status": true,
  "light_status": true,
  "wifi_rssi": -58,
  "source": "simulation",
  "timestamp": "2026-09-29T10:14:05Z"
}
```
Validation: `temperature` −10…60 or `null`; `humidity` 0…100 or `null`; `source` in `simulation|esp32`. Response `202 {"accepted": true}`.
Cadence contract: heartbeat every **10 s** (so the room is "online"); plus an immediate post on PIR rising edge with `"event":"motion"`.

**POST `/api/camera-detections`** — vision service
```json
{
  "classroom_id": "A101",
  "camera_id": "phone-a101",
  "people_detected": 7,
  "occupancy_status": "occupied",
  "confidence": 0.94,
  "source": "camera",
  "fps": 5.2,
  "timestamp": "2026-09-29T10:14:05Z"
}
```
`occupancy_status` (`occupied`|`empty`) is the camera's local hint only; the engine ignores it and uses `people_detected`. Cadence: every 2 s (doubles as camera heartbeat).

**GET `/api/classrooms/{id}/commands/pending`** → `[{ "id": 12, "device": "ac", "command": "off" }]`
**POST `/api/commands/{id}/ack`** → `{ "acked": true }`
(Device polls every 5 s. The ESP32 relay firmware will do the same.)

### 7.2 Read (dashboard-facing)

| Method & path | Purpose |
|---|---|
| `GET /api/health` | liveness + DB check |
| `GET /api/classrooms` | list with current state (join `classroom_state`) |
| `POST/PUT/DELETE /api/classrooms[/{id}]` | classroom admin |
| `GET /api/classrooms/{id}` | detail: state + current & next timetable entry + open alerts |
| `GET /api/classrooms/{id}/history?from&to&resolution=1m\|15m\|1h` | occupancy/temperature/energy series from snapshots |
| `GET /api/dashboard/summary` | KPI block (§13) |
| `GET/POST/PUT/DELETE /api/timetable` (`?classroom_id&day`) | timetable CRUD; `POST /api/timetable/import` (CSV) optional |
| `GET /api/alerts?status&classroom_id` | alert list |
| `POST /api/alerts/{id}/acknowledge` · `/resolve` | alert actions |
| `GET /api/energy/recommendations` | current recommendations (§11) |
| `POST /api/classrooms/{id}/actions` `{device, command}` | creates a `device_commands` row |
| `GET /api/watchman/tasks` | simplified task list (§12) |
| `GET /api/cameras` | camera feeds: online, last seen, fps, stream URL |
| `GET /api/analytics/utilization?from&to` · `/peak-hours` · `/underutilized` · `/expected-vs-actual` · `/environment` · `/energy` | analytics (§14) |
| `GET /api/predictions?classroom_id&date` · `POST /api/predictions/train` · `GET /api/predictions/model` | prediction (§15) |
| `GET/PUT /api/settings` (+ `POST /api/settings/preset/{name}`) | thresholds |

OpenAPI must be complete. The frontend `types/` are generated from it (`openapi-typescript`) from Phase 5 onward.

---

## 8. OCCUPANCY ENGINE (`api/app/engine/occupancy.py`)

Pure function. Injectable `now`. Evaluated for every active classroom every **5 s** by the evaluator loop and once after each ingest (debounced).

```python
evaluate_occupancy(room, camera, sensor, schedule, settings, now) -> OccupancyResult
# OccupancyResult:
#   state, confidence_level, reasons[list[str]], people_count|None,
#   expected(bool), idle_minutes, evidence{camera_fresh, pir_fresh, motion_recent, timetable_entry_id}
```

### States
`OCCUPIED` · `EMPTY` · `EXPECTED_OCCUPANCY` · `UNEXPECTED_OCCUPANCY` · `OCCUPANCY_ANOMALY` · `SENSOR_UNCERTAIN`

### Definitions
- `camera_fresh` = has_camera and last camera event ≤ `camera_fresh_sec` ago.
- `pir_fresh` = has_pir and last sensor event ≤ `sensor_fresh_sec` ago.
- `people` = smoothed camera count if `camera_fresh`, else `None`. To avoid flicker, a drop from ≥1 to 0 only takes effect after the camera has reported 0 continuously for `camera_empty_hold_sec` (30 s).
- `motion_recent` = last PIR motion ≤ `pir_recent_min` ago (only meaningful if `pir_fresh`).
- `expected` = a timetable entry covers `now` in the window `[start − pre_start_min, end + post_end_min]`.
- `in_grace` = expected and `now < start + grace_min` (people are still arriving).
- `idle_minutes` = minutes since last presence evidence (camera > 0 or PIR motion); if never observed, since the engine first saw the room.

### Decision table (first match wins)

| # | Condition | State | Confidence |
|---|---|---|---|
| 1 | Every installed sensor is stale (no fresh camera when `has_camera`, no fresh PIR when `has_pir`) | `SENSOR_UNCERTAIN` | low |
| 2 | `people ≥ 1` and `expected` | `OCCUPIED` | high if PIR motion agrees or no PIR; medium if PIR silent (reason: "PIR cannot detect still people") |
| 3 | `people ≥ 1` and not `expected` | `UNEXPECTED_OCCUPANCY` | high/medium as above |
| 4 | no people, `motion_recent`, `expected`, `in_grace` | `EXPECTED_OCCUPANCY` | medium |
| 5 | no people (camera says 0 or no camera), `motion_recent`, `expected` | `OCCUPIED` | low if camera exists and sees nobody (reason: "motion only — check camera coverage"), medium if no camera |
| 6 | no people, `motion_recent`, not `expected` | `UNEXPECTED_OCCUPANCY` | low (camera exists) / medium (PIR-only room) |
| 7 | no presence evidence, `expected`, `in_grace` | `EXPECTED_OCCUPANCY` | medium |
| 8 | no presence evidence, `expected`, past grace, `idle_minutes ≥ anomaly_min` | `OCCUPANCY_ANOMALY` | medium |
| 9 | no presence evidence, `expected`, past grace, `idle_minutes < anomaly_min` | `EXPECTED_OCCUPANCY` | medium |
| 10 | no presence evidence, not `expected` | `EMPTY` | high if camera+PIR both fresh and agree, else medium |

Rules:
- **Never claim certainty.** `confidence_level` and `reasons[]` are always populated and shown in the UI ("Camera: 0 people · PIR: no motion 17 min · Timetable: DBMS scheduled").
- Partial sensor failure (one of camera/PIR stale) lowers confidence by one level and adds a reason; it does not force `SENSOR_UNCERTAIN`.
- PIR misses still people; camera can miss occluded people. Camera > 0 always outranks PIR silence.

### Required unit tests (minimum)
The three scenarios from the brief (7 people + motion + class → OCCUPIED; 0 people + 15 min no motion + class → OCCUPANCY_ANOMALY; 0 + no motion + no class → EMPTY), plus: unexpected occupancy, grace period, camera offline with PIR fresh, both offline, PIR-only room, camera flicker hold, camera>0 with silent PIR, post-class overrun window, back-to-back classes.

---

## 9. SETTINGS / THRESHOLDS

| Key | Production | Demo |
|---|---|---|
| `camera_fresh_sec` | 15 | 15 |
| `sensor_fresh_sec` | 30 | 30 |
| `camera_empty_hold_sec` | 30 | 10 |
| `pir_recent_min` | 15 | 1 |
| `pre_start_min` | 5 | 5 |
| `post_end_min` | 10 | 2 |
| `grace_min` | 10 | 1 |
| `anomaly_min` | 15 | 2 |
| `idle_alert_min` (energy) | 15 | 1 |
| `idle_critical_min` | 30 | 3 |
| `precool_min` (don't recommend AC-off if next class starts within) | 15 | 1 |
| `working_hours` | 08:00–18:00 | 08:00–18:00 |
| `underutilized_threshold` | 0.30 | 0.30 |
| `ac_kw` / `lights_kw` fallback | 1.5 / 0.3 | 1.5 / 0.3 |

Settings page: preset switch + editable values with validation.

---

## 10. TIMETABLE

- Admin UI: a **weekly grid** (Mon–Sat × time rows, one classroom selected at a time) styled like a printed timetable sheet, plus a table view. Add/edit via a modal form: Classroom, Subject, Faculty, Day, Start, End, Class type.
- Backend: `engine/schedule.py` provides `get_active_entry(classroom, now)`, `get_next_entry(...)`, `is_expected(...)`. Handles IST conversion and back-to-back classes.
- Overlap check on create/update (409).
- Detail views show **Expected vs Actual** side by side.

---

## 11. ENERGY ENGINE (`engine/energy.py`, pure)

Inputs: `OccupancyResult`, `ac_status`, `light_status`, next timetable entry, settings, room ratings.

Preconditions for a recommendation:
- occupancy state ∈ {`EMPTY`, `OCCUPANCY_ANOMALY`} (never while people or motion evidence exists), and
- `idle_minutes ≥ idle_alert_min`, and
- sensors not `SENSOR_UNCERTAIN` (in that case emit only an info-level "Verify sensors — appliances ON").

Suppression: AC-off is suppressed if the next class in this room starts within `precool_min`. Lights-off is never suppressed by the timetable.

Output per room:
```json
{
  "classroom_id": "A101",
  "headline": "Classroom appears unoccupied while AC and lights are ON.",
  "context": "Scheduled 10:00–11:00 (DBMS). Now 11:23. People: 0. PIR: no movement.",
  "idle_minutes": 23,
  "severity": "warning",
  "actions": [ {"device":"ac","command":"off"}, {"device":"light","command":"off"} ],
  "estimated_waste_kwh": 0.62,
  "estimate_note": "Estimate from rated power × idle time"
}
```
`severity`: `warning` at `idle_alert_min`, `critical` at `idle_critical_min`. If the state is `OCCUPANCY_ANOMALY` (class scheduled but room empty) the watchman text says "Class scheduled but room empty — verify before switching off."

Actions in UI: `[ TURN OFF AC ]` `[ TURN OFF LIGHTS ]` → `POST /api/classrooms/{id}/actions`. The row shows "Command sent → waiting for device" until acked, then the alert auto-resolves when the next reading shows the appliance OFF.

---

## 12. ALERTS & WATCHMAN

Alert manager (`engine/alerts.py`, pure diff between "desired alerts now" and "current open alerts"):
- create when condition true; update `last_seen`; auto-resolve when condition false for 60 s; dedupe by `(classroom_id, type)`.
- Types: energy (AC/lights idle), `UNEXPECTED_OCCUPANCY`, `OCCUPANCY_ANOMALY`, `SENSOR_OFFLINE`, `CAMERA_OFFLINE` (only for rooms with a camera).

**Watchman view** (`/watchman`, big type, zero analytics):
```text
ATTENTION REQUIRED                                     3 tasks

▌A101   Block A · Floor 1
▌AC ON + No people                     23 min idle
▌[ MARK CHECKED ]

▌B203   Block B · Floor 2
▌Lights ON + No people                 17 min idle

▌C102   Block C · Floor 1
▌Unexpected occupancy — no scheduled class
```
Each task: **WHERE** (room, block, floor), **WHY** (one line), duration, severity colour + text label, and one button. Sorted by severity, then idle time; optional "group by block" toggle to shorten walking. "Mark checked" snoozes that alert 30 min (does not delete it). Empty state: "ALL CLEAR". Must be usable on a phone screen.

---

## 13. ADMIN DASHBOARD SUMMARY (`GET /api/dashboard/summary`)

`total_classrooms`, `occupied_now`, `empty_now`, `expected_now`, `unexpected_now`, `anomalies`, `sensor_uncertain`, `energy_alerts`, `rooms_in_use_pct` (occupied+unexpected ÷ total), `seat_utilization_pct` (people ÷ capacity, **camera rooms only** — label it as such), `avg_temperature`, `camera_feeds_active` ("1 / 1" format), `sensors_online` ("n / N").

---

## 14. ANALYTICS (SQL over `occupancy_snapshots`, 1-minute granularity)

- **Classroom utilization** = (minutes state ∈ {OCCUPIED, UNEXPECTED_OCCUPANCY}) ÷ (minutes in `working_hours`).
- **Scheduled utilization** = minutes OCCUPIED during scheduled slots ÷ scheduled minutes.
- **Seat utilization** = avg people ÷ capacity while occupied (camera rooms only).
- Daily & weekly occupancy curves; **peak hours** (top hourly slots by utilization, per room and campus-wide); **underutilized rooms** (utilization < `underutilized_threshold`); **expected vs actual** per hour (timetable said occupied / room actually occupied → "no-show" and "unscheduled use" counts); average temperature & humidity by room/hour; **energy-saving opportunities** = Σ idle-with-appliances-ON minutes × rated kW (labelled estimate).
- Every chart shows the data range and the share of `seed` data if any.

---

## 15. PREDICTION (`api/app/ml`)

- Features: `classroom` (encoded), `day_of_week`, `hour`, `scheduled_class` (0/1), `previous_slot_occupancy`, `historical_utilization` (mean occupancy for same room/dow/hour, computed from training data only — avoid leakage), `class_type`.
- Models: `LogisticRegression` → P(occupied) for all rooms; `Ridge` or `DecisionTreeRegressor(max_depth=4)` → expected people (camera rooms only). Baseline: historical mean by (room, dow, hour), blended with timetable prior when < 14 days of data.
- Time-based train/validation split. Report accuracy/F1 (classification) and MAE (regression) on validation. Persist artifact + metrics + coefficient/feature importance in `prediction_models`.
- UI: predicted occupancy heatmap (room × hour for a chosen date), top drivers ("scheduled_class contributes most"), and a visible banner: **"Trained on N days of data (X% synthetic)"**. If X > 0 the banner says demonstration only.
- `scripts/seed.py --days 28` generates synthetic history from timetable + realistic attendance noise, tagged `data_source='seed'`. `--purge-seed` removes it.

---

## 16. CAMERA PIPELINE (`services/vision`)

```text
Phone (IP camera app) ──Wi-Fi──► FrameSource ─► latest-frame buffer
                                                     │
                                          inference loop (~5 FPS)
                                                     │
                              YOLO (class 0 = person only, conf ≥ 0.35)
                                                     │
                     ROI filter (optional) → smoothing (median of last 5) → count
                                                     │
                         ┌───────────────────────────┴────────────────────────┐
                         ▼                                                    ▼
                POST /api/camera-detections (every 2 s + on change)   annotated frame → MJPEG /stream/{id}.mjpg
```

**Frame source (phone).** Config in `config/cameras.yaml`:
```yaml
cameras:
  - classroom_id: A101
    camera_id: phone-a101
    source: "http://<PHONE_IP>:8080/video"   # Android "IP Webcam" MJPEG
    # alternatives: DroidCam "http://<ip>:4747/video", any rtsp:// URL, or an int (USB/laptop webcam index)
    roi: null                                  # optional polygon [[x,y],...] to ignore corridor/windows
    model: yolo11n.pt
    conf: 0.35
    imgsz: 640
```
Implement `MjpegSource`, `RtspSource`, `UsbSource`. A `--source <path>` option that reads a recorded video file is allowed **for testing the detector only** (dev flag; posts are labelled with `camera_id` suffix `-file` and are excluded from analytics).

**Must-do engineering details:**
1. **Capture thread always keeps only the latest frame** (drop the rest). Naïve `cap.read()` on network streams builds up buffer lag of seconds — this is the #1 bug in phone-camera setups.
2. Auto-reconnect with exponential backoff (1 → 30 s); when the stream is down, stop posting (backend marks camera offline after `camera_fresh_sec`).
3. Inference on the latest frame only; measure and expose real FPS and inference latency.
4. Person class only. **No tracking IDs, no face models, no crops, no frame saving, no identity of any kind.** Frames live in memory only.
5. Smoothing: median of the last 5 inferences to avoid count flicker.
6. `confidence` = mean score of counted persons. When count is 0: `1 − max(score of any person detection below threshold)` (clamped 0–1). Document that this is a model score, not a calibrated probability.
7. Post with retry; never queue old counts (drop stale events — only fresh data matters).
8. Preview server (FastAPI, port 8001): `GET /stream/{classroom_id}.mjpg` (frames with **plain boxes labelled "person"** and a small count overlay, no other effects), `GET /status` (fps, latency, source state, last count), `GET /health`. CORS allow the web origin.
9. Dashboard behaviour: `<img src=".../stream/A101.mjpg">`; on error show a bordered "CAMERA OFFLINE" panel with last seen time.

**docs/CAMERA_SETUP.md** must cover:
- Same-network requirement. **College Wi-Fi often enables client isolation, which blocks phone↔laptop traffic.** Recommended: use the phone's hotspot or the laptop's hotspot; alternative: USB with `adb forward tcp:8080 tcp:8080` for Android.
- Phone: fixed position (tripod/stand), landscape, screen-on & battery-saver off, plugged in.
- Camera placement guidance: elevated, front-corner view covering seating; avoid backlight from windows.
- Accuracy limits: `yolo11n` under-counts occluded back-row students; offer `yolo11s`/`imgsz 960` as accuracy upgrades and report the FPS trade-off.

---

## 17. SENSOR SIMULATOR (`services/sensor-sim`)

Runs as its own process; posts to `POST /api/sensor-data` using the same payload and `X-Device-Key` as the ESP32. Config `config/rooms.yaml` lists rooms, timetable-awareness and behaviour parameters.

**Per-room model (updates every 1 s, posts a heartbeat every 10 s):**

- **Occupancy driver** (per room, mode switchable at runtime):
  - `auto` — follows the timetable: during a class, attendance ≈ 60–95 % of capacity with arrival/leaving ramps; between classes low random activity.
  - `follow_camera` — for `A101`: reads `GET /api/classrooms/A101/state` (`last_camera_count`) so the simulated PIR/temperature agree with what the real phone camera sees. (Consumes only the public API.)
  - `force_occupied` / `force_empty` — for demos and tests.
- **PIR (HC-SR501 behaviour):** motion arrives as **events** (Poisson process; rate rises with people count, is low for seated people). Each trigger holds output HIGH for `hold_s` (5–10 s) then LOW with a ~3 s lockout. Heartbeats report current level; a rising edge also posts immediately with `"event":"motion"`. Seated people are sometimes missed (realistic).
- **DHT11:** internal float temperature model → quantised to whole °C and whole %RH on output; 1 % of reads fail (`null`).
  - Empty, AC off → drifts toward ambient (30–34 °C daytime).
  - Occupied → rises ≈ +0.02–0.05 °C/min per 10 people (first-order lag, not instant).
  - AC on → relaxes toward ~24–26 °C; humidity inversely related.
  - Small noise; never large jumps.
- **Appliances (behavioural, to create realistic energy waste):**
  - At class start: lights ON with p = 0.9, AC ON with p = 0.8.
  - At class end: with p = 0.35 someone forgets AC/lights ON for 10–60 min ("forgetfulness").
  - Applies queued `device_commands` (polls `GET …/commands/pending` every 5 s, applies, then `ack`) — this closes the demo loop: press TURN OFF AC → AC flips OFF → alert resolves.
- **Connectivity:** random dropouts 30–120 s (no posts) at ~1 per few hours per room; configurable; `POST /control/{room}/offline?seconds=90` forces one.
- **Control server (port 8002):** `PUT /control/{room}/mode`, `POST /control/{room}/appliances`, `POST /control/{room}/offline`, `GET /control/state`. Optional dev-only "Simulator Controls" panel in the Settings page (behind `VITE_DEV_TOOLS=true`).
- **Scenario presets** (`scripts/make_demo_timetable.py --now`): creates timetable entries around the current time so a demo can show every state: A101 class in session (real camera), B203 class ended 25 min ago with AC ON, C102 no class but occupied, D104 class scheduled but empty (anomaly), E201 sensor dropout.

`docs/ESP32_CONTRACT.md` documents the exact JSON, headers, cadence and command-polling loop so the firmware can be written against it. Phase 15 adds `firmware/esp32/` with a stub sketch making the identical POST (untested until hardware exists, clearly marked as such).

---

## 18. PHASE 0 REPORT FORMAT (planning only, then STOP)

Return, concisely:

- **A. Current repository assessment** — frontend framework/version, components, routing, styling system, existing backend/DB, tests, conflicts with this spec.
- **B. Proposed architecture** — mapping of §4 layout onto the existing repo (do not move existing files unnecessarily).
- **C. Data model** — final tables (deltas from §6, if any).
- **D. API contract** — final endpoint list (deltas from §7).
- **E. Camera pipeline**
- **F. Sensor simulation pipeline**
- **G. Page/component architecture** (§21)
- **H. Implementation phases** (deltas from §19)
- **I. Risks and technical limitations** (include anything not in §22)
- **J. Exact first implementation steps** (file-level)

Also list every question you genuinely cannot resolve yourself. Then wait.

---

## 19. IMPLEMENTATION PHASES

Each phase ends with: tests green, app runs, short verification report, commit.

| Phase | Scope | Acceptance criteria |
|---|---|---|
| **0 ⛔** | Plan (§18) | Report delivered; human approves. |
| **1** | App shell + navigation: sidebar/top nav for all 10 routes (§21), layout, design tokens, empty page stubs, 404. | All routes render; nav works on desktop and phone width; no console errors. |
| **2** | Dashboard with realistic mock data via `services/api.ts` mock adapter (`VITE_USE_MOCKS=true`). Types in `types/`. | Dashboard shows all KPIs, classroom grid in every state, attention panel, charts; mock adapter and real client share one interface. |
| **3** | Classroom data model: SQLAlchemy models + Alembic initial migration, Pydantic schemas, classroom & timetable CRUD, settings, seed of ~12 classrooms across 3–4 blocks. | `alembic upgrade head` on empty MySQL works; CRUD tested; overlap → 409. |
| **4** | Sensor simulator service (§17), standalone: can print events to console or post to API. Unit tests for PIR hold/lockout, DHT quantisation, thermal model, forgetfulness. | Runs for 10 min without exceptions; values realistic (no random jumps); dropout works. |
| **5** | `POST /api/sensor-data` with device-key auth, validation, `202` response. Generate OpenAPI → TS types. | Simulator → API works; invalid payloads rejected with clear errors; `source="esp32"` accepted identically (test). |
| **6** | Persistence: sensor readings stored, `classroom_state` updated, retention job, dashboard switched from mocks to real API. | Rows appear in MySQL; dashboard shows live simulated values; mock flag off. |
| **7 ⛔** | Real phone camera stream: `vision` capture layer only (`FrameSource`s, latest-frame buffer, reconnect), preview of raw frames, `docs/CAMERA_SETUP.md`. | **Human verifies** phone stream visible on laptop with < 1 s lag over hotspot/USB. |
| **8** | OpenCV + YOLO person detection: inference loop, ROI, smoothing, annotated MJPEG server, `/status`. | Boxes drawn correctly on live phone feed; count matches people in view; FPS reported; no frames written to disk (test/grep for `imwrite`). |
| **9 ⛔** | Camera detection API + poster + `camera_detections` persistence; Live Camera page + classroom camera panel (§21) using the MJPEG `<img>`. | **Human verifies** walking in front of phone changes the dashboard count within ~3 s; offline handling works when Wi-Fi is cut. |
| **10** | Occupancy engine (§8) with full unit tests, timetable UI + `schedule.py`, evaluator loop, snapshots writer; classroom detail page shows reasons/confidence, expected vs actual. | All required scenarios pass; states appear live; demo preset shows every state. |
| **11** | Energy engine (§11) + device command queue + Energy page + simulator applying commands. | Press TURN OFF AC → simulator flips AC → alert resolves within ~15 s. |
| **12** | Alerts (§12) + Watchman view. | Alerts dedupe/resolve correctly; watchman page usable at 390 px width. |
| **13** | Analytics (§14) + Reports page (print-friendly stylesheet, CSV export). Seed script for history. | Numbers reconcile with raw snapshots (test with a known dataset). |
| **14** | Prediction (§15). | Model trains from seeded data; heatmap renders; synthetic-data banner visible. |
| **15** | Testing & refinement: smoke script, README run guide, ESP32 stub + contract doc, accessibility pass, performance check with 12 rooms polling, cleanup. | `scripts/smoke.py` passes end-to-end; a fresh clone runs following README only. |

---

## 20. KICKOFF PROMPT (paste this into Antigravity)

> Read `docs/SPEC.md` completely. Execute **Phase 0 only**: inspect the existing repository and return sections A–J from §18. Do not write code, install packages, or modify any files. Follow §0 (agent operating rules). When finished, stop and wait for my approval. If anything in the spec conflicts with the existing codebase, flag it in section A/I rather than resolving it silently.

Then, for each subsequent step:

> Approved. Implement **Phase N** exactly as specified in `docs/SPEC.md` §19. Follow §0. At the end, report what you verified and how, then commit as `phase-N: …` and stop at any ⛔ gate.

---

## 21. FRONTEND SPEC

### Routes
`/` Dashboard · `/classrooms` · `/classrooms/:id` · `/camera` · `/timetable` · `/energy` · `/analytics` · `/predictions` · `/alerts` · `/reports` · `/settings` · `/watchman` (simplified layout, no admin nav)

### Key components
`AppShell`, `NavRail`, `KpiCell`, `RoomPlate` (classroom tile styled like a door number plate), `StateStamp`, `ConfidenceBadge`, `EvidenceList` (camera/PIR/timetable reasons), `CameraPanel`, `TimetableGrid`, `TimetableForm`, `AlertRow`, `WatchmanTask`, `EnergyRecommendationRow`, `OccupancyChart`, `Heatmap`, `DataTable`, `EmptyState`, `Banner` (used for "simulated data"/"synthetic data"/"offline").

### Camera panel (dashboard + classroom detail)
```text
CLASSROOM A101
┌──────────────────────────────────┐
│  annotated MJPEG (boxes only)    │
└──────────────────────────────────┘
People detected: 4          Occupancy: OCCUPIED
Detection confidence: 94%   Source: LIVE CAMERA
```
Rooms without a camera show "NO CAMERA — occupancy from PIR + timetable" and `—` for people. Source label always reflects the truth: `LIVE CAMERA`, `SIMULATED SENSORS`, `ESP32`, `SEED DATA`.

### Classroom detail sections
Current occupancy (state, confidence, reasons) · detected people · camera status · PIR status (last motion) · temperature · humidity · AC · lights · current & next timetable entry · expected vs actual · occupancy history · energy history · alerts.

### Design system — professional Neo-Brutalism (college signage / timetable sheet / notice board)
- **Palette:** paper `#F4F1EA`, ink `#111111`, panel white `#FFFFFF`, muted grey `#6B6B6B`; state colours: occupied green `#2F9E44`, empty grey `#9AA0A6`, expected blue `#2F6FDE`, unexpected amber `#F2A900`, anomaly red `#D64545`, uncertain purple-grey `#7A6FA8`; notice-board yellow `#F2C94C` for attention banners.
- **Structure:** 2 px solid ink borders, square corners (max 2 px radius), **hard offset shadow 3 px** (`3px 3px 0 #111`) on cards only; thin ruled lines like a register (table rows with 1 px ink separators); header strips like form headings ("FORM · CLASSROOM STATUS").
- **Type:** headings — Archivo or Space Grotesk (bold, slightly condensed feel); **classroom numbers and figures — IBM Plex Mono** (signage/engineering-label look); body — Inter or system UI. Base size 14 px on dense tables, 16 px on watchman view.
- **Rules:** every state uses **colour + text label** (never colour alone); no gradients, glassmorphism, glow or neon; motion limited to 150 ms hover/press offset and a loading skeleton; focus rings visible (3 px offset ink outline); minimum 44 px touch targets in the watchman view; contrast ≥ WCAG AA.
- **Density:** dashboard fits KPI strip + room grid + attention panel + one chart above the fold at 1440×900. Must not look childish or futuristic; prefer usability over decoration.
- Responsive: admin views work down to tablet width; watchman view is phone-first.

### Dashboard layout
Top: 8-cell KPI strip (§13). Left (2/3): classroom grid of `RoomPlate`s grouped by block with legend. Right (1/3): "ATTENTION REQUIRED" panel (top 5 alerts, link to Alerts) + camera panel for `A101`. Bottom: today's occupancy vs expected (Recharts), avg temperature by block.

---

## 22. RISKS & KNOWN LIMITATIONS (document in README)

1. **Only one real camera** → prototype analytics for camera-derived people counts cover `A101` only; other rooms are PIR + timetable + simulation. Be explicit in the UI.
2. **Wi-Fi client isolation** on college networks can block the phone stream — use a hotspot or USB forwarding.
3. **Network-stream latency/buffering** (see §16 item 1); phone thermal throttling and battery drain on long runs — keep plugged in.
4. **YOLO nano accuracy** drops with occlusion, small/back-row people, poor lighting; counts are estimates, not attendance.
5. **PIR blind spot:** cannot detect still people; **DHT11** is coarse (±2 °C, ±5 %RH) and slow.
6. **Simulator ≠ reality:** it validates software behaviour, not sensor placement, noise or firmware timing. Real ESP32 has no reliable clock without NTP (server timestamp fallback covers this), Wi-Fi drops, and needs a retry queue.
7. **Prediction quality** depends on real history; with synthetic seed data it is a demonstration only and is labelled so.
8. **Privacy:** no facial recognition, no identity, no stored frames or crops; only counts leave the vision service. Put a notice on classroom cameras when deployed and check the institution's policy before real deployment.
9. **Relay control** (future) switches mains loads — needs a certified relay module, isolation and an electrician; not in scope for software v1.
10. MySQL dialect differences vs SQLite in tests — keep a small integration test against MySQL in CI/local.

---

## 23. RUN GUIDE (must be in README, verified in Phase 15)

```bash
cp .env.example .env                      # set DEVICE_KEY, DATABASE_URL, VITE_API_URL
docker compose up -d mysql
cd services/api && pip install -r requirements.txt && alembic upgrade head
python ../../scripts/seed.py --classrooms --timetable [--days 28]
uvicorn app.main:app --reload --port 8000

cd services/sensor-sim && python -m sim.main            # port 8002
cd services/vision     && python -m vision.main         # port 8001, uses config/cameras.yaml
cd apps/web && npm i && npm run dev                     # port 5173
```

`.env.example` keys: `DATABASE_URL`, `DEVICE_KEY`, `API_URL`, `TZ=Asia/Kolkata`, `VITE_API_URL`, `VITE_VISION_URL`, `VITE_USE_MOCKS`, `VITE_DEV_TOOLS`, `SETTINGS_PRESET`.
