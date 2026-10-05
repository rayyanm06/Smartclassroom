# LANDING PAGE COMPONENT & ARCHITECTURE MAP (Step A)

Generated for: `LIGHTNING_UPGRADE_PLAN.md`
Root Workspace: `D:\Miniproject`
Application: `apps/web`

---

## 1. Role Resolutions

| Role Name | File Path & Lines | Details |
|---|---|---|
| `LANDING_DIR` | `apps/web/src/components/intro` | Contains engine, primitives, world (hardware + scenes), overlays, static, transition, and styles. |
| `STAGE` | `apps/web/src/components/intro/engine/StageProvider.tsx:210-212` | `.lp-stage` pinned/sticky container inside `.lp-track`. Styled in `intro.css:37-44` (`position: sticky; top: 0; width: 100vw; height: 100dvh; overflow: hidden;`). |
| `PROGRESS_SOURCE` | `apps/web/src/components/intro/engine/StageProvider.tsx:101-110,172-174` | `displayPRef` and `nextP` (0..100). Divided by 100 to yield `p ∈ [0, 1]` for `energyProgress.set(p)`. |
| `ESP32_SVG` | `apps/web/src/components/intro/world/hardware/Esp32Board.tsx` | Full vector ESP32-WROOM-32 component. |
| `BLACK_SHAPE` | `apps/web/src/components/intro/world/hardware/Esp32Board.tsx:29` | `<rect x={12} y={12} width={280} height={480} rx={0} fill="#111111" />` rendered behind the board inside `#esp32__plate`. |
| `PIR` | `apps/web/src/components/intro/world/hardware/PirSensor.tsx` | HC-SR501 PIR sensor component. |
| `DHT11` | `apps/web/src/components/intro/world/hardware/Dht11Sensor.tsx` | DHT11 environmental sensor component. |
| `RELAY1`, `RELAY2` | `apps/web/src/components/intro/world/hardware/RelayModule.tsx` | 2-channel relay module with schematic levers and indicator LEDs. |
| `LIGHT` | `apps/web/src/components/intro/world/hardware/CeilingLight.tsx` | Classroom ceiling LED batten with radiating light beams. |
| `AC` | `apps/web/src/components/intro/world/hardware/SplitAc.tsx` | Split-unit air conditioner with movable louvers and cooling airflow chevrons. |
| `CAMERA` | `apps/web/src/components/intro/world/hardware/PhoneCamera.tsx` | Smartphone on tripod with RTSP feed, walking person silhouette, and YOLO11n detection box. |
| `COMPUTER` | `apps/web/src/components/intro/world/hardware/Monitor.tsx` | 1200x720 central host monitor with port notches, checks, and 404 mode. |
| `WIRES` | `apps/web/src/components/intro/engine/paths.ts` | Wire paths: `LANDSCAPE_PATHS.sensorWires` (PIR to ESP, DHT to ESP), `LANDSCAPE_PATHS.relayWires` (ESP to Relays), `LANDSCAPE_PATHS.loadWires` (Relays to Light/AC), `LANDSCAPE_PATHS.rtspWire`, and `LANDSCAPE_PATHS.trunks` (7 data trunks to computer at (1200, 1900)). |
| `PACKETS` | `apps/web/src/components/intro/world/scenes/DataFlowScene.tsx` | Uses `DataPacket.tsx` to ride `LANDSCAPE_PATHS.sensorWires` guides. |
| `SCENE_WINDOWS` | `apps/web/src/components/intro/engine/timeline.ts:48-63` | 14 chapters matching blueprint global progress windows: 0-8, 8-20, 20-27, 27-34, 34-41, 41-45.5, 45-54, 54-60, 60-70, 70-82, 82-87.4, 87.4-90, 90-96, 96-100. Exactly aligns with `energyTimeline.ts` `ANCHORS`. |
| `NOT_FOUND_SCENE` | `apps/web/src/components/intro/world/scenes/Error404Scene.tsx` & `Monitor.tsx:120-176` | Scene 12 theatrical 404 glitch and screen fracture. |
| `BOOT_SCENE` | `apps/web/src/components/intro/overlays/BootScene.tsx` | Scene 13 VT100 recovery boot terminal. |
| `READY_SCENE` | `apps/web/src/components/intro/overlays/ReadyScene.tsx` | Scene 14 `ARE YOU READY?` typography climax. |
| `CTA` | `apps/web/src/components/intro/overlays/ReadyScene.tsx:43-47` & `BrutalistButton.tsx` | `INITIALIZE DASHBOARD →` button invoking `runDashboardTransition(navigate)`. |
| `SCROLLBAR` | `apps/web/src/components/intro/overlays/SceneProgress.tsx` | 14-chapter vertical progression tick bar. |
| `NAV_TARGET` | `'/'` | SPA route target for main facility dashboard. |
| `LANDING_CSS` | `apps/web/src/components/intro/intro.css` | Scoped `.lp-root` CSS tokens and stage styles. |

---

## 2. Global Progress Alignment

The existing engine measures progress as `progress ∈ [0, 100]`.
The new energy system operates strictly with `p ∈ [0, 1]`.
Adapter in `StageProvider.tsx`:
```ts
energyProgress.set(nextP / 100);
```
Unmount cleanup in `StageProvider.tsx`:
```ts
energyProgress.set(0);
```
Anchor mapping in `energyTimeline.ts` is 1:1 identity (`[0, 0]`, `[0.34, 0.34]`, etc.).
