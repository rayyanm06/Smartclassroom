# SMART CLASSROOM — SCROLL-DRIVEN LANDING PAGE
## Implementation Blueprint for Antigravity

**Status:** PLANNING ONLY. Nothing in the repository was modified to produce this document.
**Inspected:** `Miniproject.zip` (`apps/web` source, `docs/`, `cameras.yaml`, `services/vision`, `services/sensor-sim`, `services/api/app/routers`, `docs/SPEC.md`). `node_modules` was not inspected; dependency facts come from `package.json` and `package-lock.json`.

**Reading order for Antigravity:** Sections 1–4 (facts + architecture) → 22 (build order) → 6–8 (what to build) → 11–13 (assets, wires, packets) → 24 (definition of done). Coordinates in this document are **authoritative starting values**; verify each visually with the debug overlay (§23) and adjust by small amounts only. Do not redesign the concept.

---

## 0. DECISIONS AND FLAGGED ITEMS (read first)

| # | Decision / finding | Consequence |
|---|---|---|
| D-1 | **The dashboard already lives at `/`** (index route under `AppShell`). | The landing page goes at a **new route `/intro`**. `/` stays untouched. The CTA navigates to `/`. Swapping so the intro is the default entry is optional Phase 2 (§17). |
| D-2 | **No animation library is installed** (no GSAP, Motion/Framer, Lenis, Three, Lottie). | Recommended: **no new dependency**. A small custom "progress-driven stage engine" (§4). |
| D-3 | Requested tokens differ from the app's existing tokens (`#F4F0E6` vs `#F4F1EA`, `#E53935` vs `#D64545`, `#35C759` vs `#2F9E44`). | Landing tokens are **scoped** to `.lp-root` as `--lp-*` CSS variables. The global `@theme` in `index.css` is **not** edited. |
| D-3b | Archivo is installed at weights 400/600/700 only. Landing display type wants 900. | Import `@fontsource/archivo/latin-800.css` and `latin-900.css` from the **already-installed** package inside the intro stylesheet. No `package.json` change. |
| D-4 | `firmware/` is an **empty folder**. `docs/SPEC.md` says the ESP32 stub arrives in Phase 15. PIR and DHT11 are simulated by `services/sensor-sim`. The only live real-world input is the phone camera (`cameras.yaml`: `phone-508`, RTSP, `yolo11n.pt`, conf 0.35, imgsz 640). | The story shows the **target architecture**. Honesty rules in §6 (footer status strip, `SAMPLE` chips, `DEMO SEQUENCE` tag) apply on every scene. |
| D-5 | The brief's system-check lists say `ESP32 .... OK`, `SENSORS .... OK`. Those are not literally true today. | Keep the brief's exact text, but the monitor and terminal always carry a small **`DEMO SEQUENCE · NOT LIVE STATUS`** tag. **Your call:** if you want zero risk of misreading, change the two lines to `SENSORS .... SIM` and `ESP32 .... TARGET`. |
| D-6 | The brief lists `LIGHT: ON` and `AC: OFF` on the data lines, but Scene 08 ends with both OFF. | Story fix (no concept change): when the person is detected in Scene 09, relay 1 flips back and the **light turns ON again** (§6, Scene 09→10). AC stays OFF. Labels then match exactly. |
| D-7 | The landing page must not call the API. | No React Query, no `services/api.ts`, no fetch. It works with the backend down. |
| D-8 | `/watchman` is already a top-level route outside `AppShell`. | `/intro` follows the same pattern: a sibling route, no `NavRail`. |
| D-9 | The zip contains `.env` files, including a MySQL root password in the root `.env`. | Do not hand the zip or `.env` to any tool or repo you don't fully control. Rotate that password if the zip has been shared. |
| D-10 | Existing SPEC design rules say "no gradients/glow/neon; motion limited to 150 ms". The landing page is intentionally more cinematic. | The intro is an isolated module (`components/intro/`, `pages/IntroPage.tsx`). It must not leak styles or tokens into the app (§9). |

---

## 1. EXISTING FRONTEND ARCHITECTURE

- **Location:** `apps/web` (Vite app). Monorepo root also has `services/api` (FastAPI :8000), `services/vision` (FastAPI :8001, MJPEG stream + YOLO11n), `services/sensor-sim`, `scripts/`, `docs/`.
- **Stack:** Vite 8, React 19.2, TypeScript ~6.0, Tailwind CSS 4 via `@tailwindcss/vite` (tokens in an `@theme` block inside `src/index.css`), `react-router-dom` 7.18, `@tanstack/react-query` 5, Recharts 3, `lucide-react`, `clsx`, `tailwind-merge`.
- **Entry:** `index.html` → `src/main.tsx` (`StrictMode` → `<App/>`) → `src/App.tsx` (`QueryClientProvider` + `RouterProvider`). **StrictMode is on**, so every effect mounts twice in dev. The engine must be idempotent.
- **Folders:** `src/app/router.tsx`, `src/pages/*Page.tsx` (one route component each), `src/components/layout/{AppShell,NavRail}.tsx`, `src/components/features/*` (dashboard widgets), `src/lib/styles.ts` (state→class maps), `src/services/api.ts` (+ `mocks/data.ts`; mock adapter switched by `VITE_USE_MOCKS`), `src/types/`.
- **Existing utility classes** (`index.css`): `.neo-card`, `.neo-btn` (2 px ink border, 2 px hard shadow, hover `translate(1px,1px)`, active `translate(2px,2px)`), `.neo-header-strip`, `.font-heading`, `.font-mono-numbers`.
- **Existing look:** paper `#F4F1EA`, ink `#111`, 2 px borders, square corners (≤2 px radius), 3 px hard shadows. The landing page is the same family, louder.
- **Tooling constraints Antigravity must respect:**
  - `tsconfig.app.json`: `erasableSyntaxOnly` (**no `enum`, no `namespace`, no constructor parameter properties**), `verbatimModuleSyntax` (**use `import type`** for types), `noUnusedLocals`, `noUnusedParameters`, `jsx: react-jsx`.
  - `oxlint` rules: `react/rules-of-hooks` (error), `react/only-export-components` (warn) → **component files export only components**; put constants/helpers in separate `.ts` files.
  - No frontend test runner is installed. Do not add one (§23).
  - `apps/web/dist/` exists from a previous build. Ignore it.
- **No existing landing/home page.** `/` is the dashboard.
- **No animation utilities, no `prefers-reduced-motion` handling, no `localStorage`/`sessionStorage` use anywhere in `src`.**

## 2. EXISTING ROUTE ARCHITECTURE

`createBrowserRouter` in `src/app/router.tsx` (SPA, no server routing):

```
/                  AppShell → DashboardPage (index)          ← REAL DASHBOARD
/classrooms        ClassroomsPage
/classrooms/:id    ClassroomDetailPage
/camera            CameraPage
/timetable         TimetablePage
/energy            EnergyPage
/analytics         AnalyticsPage
/predictions       PredictionsPage
/alerts            AlertsPage
/reports           ReportsPage
/settings          SettingsPage
*                  NotFoundPage (inside AppShell)
/watchman          WatchmanPage        (top-level, NO AppShell)
```

- `NavRail` hard-codes `{ path: '/', label: 'Dashboard' }` with `end` matching. `NotFoundPage` has `<Link to="/">RETURN TO DASHBOARD</Link>`. These are the **only** references to `/` as "the dashboard".
- Navigation is client-side (`NavLink`, `Link`, react-router). `useNavigate` is available for the CTA. No full reload is needed.
- All routes are statically imported. The intro route will use React Router's `lazy` so the intro code and its CSS never load for dashboard users.
- The current 404 route renders `NotFoundPage`. **The theatrical 404 scene must never reference this route or component**, and must never navigate.

## 3. CURRENT DEPENDENCIES (`apps/web/package.json`)

Runtime: `@fontsource/archivo`, `@fontsource/ibm-plex-mono`, `@fontsource/inter`, `@tailwindcss/vite`, `@tanstack/react-query`, `clsx`, `lucide-react`, `react`, `react-dom`, `react-router-dom`, `recharts`, `tailwind-merge`.
Dev: `@types/node`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `autoprefixer`, `oxlint`, `postcss`, `tailwindcss`, `typescript`, `vite`.

Searched `package-lock.json` for `gsap`, `framer`, `motion`, `lenis`, `three`, `lottie`, `anime`, `rive`: **no matches**. There is no animation library, no 3D library, no SVG animation library and no custom animation utility.

Fonts already self-hosted: **Archivo** (400/600/700, all subsets), **IBM Plex Mono** (400/600/700), **Inter** (400/500/600). Recommended pairing for the intro: **Archivo 900 (display) + IBM Plex Mono 600/700 (telemetry)**. Both are already in the project. **No new font family is needed.**

## 4. RECOMMENDED ANIMATION ARCHITECTURE

### 4.1 Decision

**Build a small custom "progress-driven stage engine". Add zero dependencies.**

| Option | Installed? | Verdict |
|---|---|---|
| GSAP + ScrollTrigger | No (2 new deps, pinning + `refresh()` on resize, StrictMode double-mount gotchas) | **Not chosen.** Good tool, but this project needs one thing: `state = f(scrollProgress)`. |
| Framer Motion / Motion | No | Not chosen. Its scroll API is fine, but ~60 concurrent transforms via React motion values is heavier than direct DOM writes and adds a dependency for no gain. |
| Lenis (smooth scroll) | No | Not chosen. It hijacks native scroll (worse for keyboard, a11y, touch). 20 lines of damping in our own rAF loop does the job. |
| Three.js / R3F | No | Rejected. The brief explicitly says no unnecessary 3D. |
| Lottie / Rive | No | Rejected. Not scroll-scrubbable per object; would create baked art. |
| **Custom engine** | — | **Chosen.** Reversibility is guaranteed by construction (no timers, no one-way state). Debuggable with a scrub slider. Zero bundle cost. |

**Escape hatch:** the engine exposes `useTrack(fn)`, where `fn(p, ctx)` writes to refs. If profiling proves the custom engine can't hold 55+ fps on a mid-tier laptop, `gsap` + `ScrollTrigger` may replace only the *progress source*. Track functions stay unchanged. Do not do this pre-emptively.

### 4.2 Core model

```
scrollY ──► targetP (0..100) ──► damped displayP ──► every registered track(p) writes DOM
```

- **The page is one tall track with one sticky stage.**
  - `.lp-track` height: **1500 vh** on landscape desktop/laptop, **1250 dvh** on portrait/mobile.
  - Inside it, `.lp-stage { position: sticky; top: 0; height: 100dvh; overflow: hidden; }`.
  - Scrollable distance = track height − viewport height. `targetP = clamp((scrollY − trackTop) / scrollable, 0, 1) × 100`.
  - On desktop, 1 % of progress ≈ 14 vh of scrolling (≈126 px at 900 px tall).
- **Damping (rAF, only while moving):** `displayP += (targetP − displayP) × (1 − exp(−dt / τ))`, with τ = 0.09 s (mouse/trackpad), 0.06 s (touch). Stop the loop when `|target − display| < 0.002`, snap, render once, and cancel rAF. **No continuous idle loop.**
- **Slew limit in the glitch window** (progress 87 – 90.5): cap `|Δdisplay|` at **5 %/s** so fast scrolling can't strobe the 404 (§15).
- **First frame:** on mount, `displayP = targetP` (no animation from 0). This handles browser-Back from the dashboard and reload-mid-page.
- **Never `preventDefault` scroll.** Native scroll, native keyboard (Space/PgDn/arrows/Home/End), native touch. Listeners are passive.
- **Every animated value is a pure function of `p`.** No `setTimeout`, no `setInterval`, no CSS keyframe loops for story elements. The only time-based animation is the click→dashboard transition (§17) and the CTA hover/press.
- **Track functions write directly to DOM refs** (`el.style.transform`, `opacity`, `style.strokeDashoffset`, `setAttribute('visibility', …)`). **React does not re-render per frame.** React only renders the scene tree once. Discrete text states (`SYSTEM STATUS: …`, `SIGNAL CONNECTED`, typed strings) are written imperatively via `textContent` / `data-state`.
- **Culling:** every scene group has an active window `[start − 1.5, end + 1.5]`. Outside it, set `visibility="hidden"` on that group so the browser skips painting it. Never `display:none` on SVG groups you measure with `getPointAtLength`.
- **Determinism:** the glitch and 404 noise use `hash01(Math.floor(p × 8))`, never `Math.random()`.

### 4.3 Helper API (`timeline.ts`, pure functions, no React)

```ts
clamp01(x)
seg(p, a, b, ease = linear): number        // 0 before a, 1 after b, eased in between
lerp(a, b, t)
keyframes(p, [[p0, v0], [p1, v1], ...], ease)   // piecewise; ease applies per segment
hash01(n)                                     // deterministic 0..1
// easings: linear, inOutSine, outCubic, inOutCubic, outQuart, steps(n)
```

`CH` (chapter boundaries) and every named window (`W.esp32Rise = [7, 13.5]`, etc.) live in **one file**, `timeline.ts`. **No scene may hard-code a progress number.** All ranges come from that table (values are in §7).

### 4.4 Coordinate system and camera

- The stage contains **one SVG "world"**, drawn inside `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet">` (landscape) or `viewBox="0 0 900 1600"` (portrait). All hardware, wires, packets and callouts live in it.
- Objects use **world coordinates** (landscape world ≈ 3400 × 2500 units; portrait world ≈ 1800 × 4400). A single root `<g id="camera">` receives:
  `transform = translate(800 − cx·z, 450 − cy·z) scale(z)` (landscape; portrait uses 450 / 800).
- The camera is a keyframed triple `(cx, cy, z)` from §7.3.
- **Big typography, terminal, HUD, CTA, curtain = HTML overlays** above the SVG (crisp text, real `<button>`, screen-reader friendly).
- **Telemetry labels and packets are counter-scaled by `1/z`** around their own center, so they hold a constant on-screen size (≥ 13 px landscape, ≥ 12 px portrait) whatever the camera zoom.
- **Background layers are HTML, not world objects** (they must not zoom): `bg-paper`, `bg-red`, `bg-dark` (stacked; opacity crossfades), plus grid, grain and registration marks. The grid layer parallax-shifts by `−0.06 × camera` (a CSS variable; transform only).

### 4.5 Layering (bottom → top)

1. `bg-paper`, `bg-red`, `bg-dark` (fixed, full-bleed)
2. `grid` (48 px, ink at 5 % alpha), `grain` (256 px tile, 4 % alpha), `halftone` (CSS radial dots, 6 px, 6 % alpha, only on the shaded side of the monitor via SVG pattern, not full-screen)
3. **SVG world:** room ghost → data lines → wires → hardware → packets → callouts
4. HTML overlays: chapter titles, stamps, HUD strip, scene ticks
5. Terminal (`.lp-terminal`, boot scene)
6. CTA layer
7. `SKIP INTRO` link (always on top)
8. Transition curtain (mounted outside React, §17)

### 4.6 Reduced motion, without a second implementation

`renderAt(p)` runs **all** tracks at a fixed `p`. When `prefers-reduced-motion: reduce` is set, the page renders **`StaticStoryboard`** (§15): ten normal-flow `<section>`s, each an `<IntroWorld frozenP={sceneEndP}/>` snapshot with a heading and caption. Same components, zero scroll choreography. The same mechanism powers `?p=NN` freeze for screenshot testing (§23).

---

## 5. EXACT COMPONENT TREE

All new code lives in **`apps/web/src/components/intro/`** (new folder) plus one thin route file **`apps/web/src/pages/IntroPage.tsx`** (matches the existing `pages/*Page.tsx` convention). Nothing outside those two locations is created.

```
pages/IntroPage.tsx                       route target; renders <IntroRoot/>; named export IntroPage
components/intro/
├── IntroRoot.tsx                         picks AnimatedIntro | StaticStoryboard (reduced motion); adds/removes html.lp-active; renders SkipIntro
├── intro.css                             ALL landing CSS: --lp-* tokens, fonts import, grid/grain, button, overlays (imported only here)
├── engine/
│   ├── StageProvider.tsx                 owns progress store, rAF loop, damping, slew limit, registers tracks
│   ├── useTrack.ts                       useTrack((p, ctx) => void)  – register/unregister in effect (StrictMode-safe)
│   ├── timeline.ts                       CH (chapters), W (all windows), CAMERA keyframes, seg/lerp/keyframes/hash01
│   ├── easing.ts                         linear, inOutSine, outCubic, inOutCubic, outQuart, steps
│   ├── layout.ts                         LANDSCAPE / PORTRAIT anchor tables; useLayout() (matchMedia)
│   ├── paths.ts                          wire + data-line `d` strings for both layouts (§12)
│   └── types.ts
├── world/
│   ├── IntroWorld.tsx                    <svg> + camera <g> + all scenes; prop frozenP? for static/debug
│   ├── scenes/
│   │   ├── IntroScene.tsx                empty classroom illustration (Scene 01) + room-ghost behaviour
│   │   ├── Esp32Scene.tsx                ESP32 + activation plate + callouts (Scene 02)
│   │   ├── SensorScene.tsx               PIR + DHT11 + labels + motion ticks (Scenes 03–04)
│   │   ├── SensorWireSystem.tsx          the 6 sensor wires, plugs, pulses, SIGNAL CONNECTED (Scene 05)
│   │   ├── DataFlowScene.tsx             MOTION / TEMP / HUMIDITY packets along the sensor wires (Scene 06)
│   │   ├── RelayScene.tsx                Relay 01 / Relay 02, their wires, load wires, Light, AC (Scene 07)
│   │   ├── EnergyScene.tsx               idle→save sequence, SENSE/DECIDE/ACT chips, CMD packets, load OFF (Scene 08)
│   │   ├── VisionScene.tsx               phone camera, frame, person, YOLO box, pipeline chips (Scene 09)
│   │   ├── DataExplosionScene.tsx        the 7 trunk data lines + labelled packets + ports (Scene 10)
│   │   ├── ComputerScene.tsx             monitor, screen content: CONNECTING/checks/crack (Scene 11)
│   │   └── Error404Scene.tsx             404 screen content, glitch slices, scanline, blocks (Scene 12)
│   └── hardware/                         one file per object; each returns a <g> with named sub-groups (§11)
│       ├── Esp32Board.tsx   PirSensor.tsx   Dht11Sensor.tsx   RelayModule.tsx
│       ├── CeilingLight.tsx SplitAc.tsx     PhoneCamera.tsx   Monitor.tsx
│       └── ClassroomIllustration.tsx
├── primitives/                           reusable, all SVG unless noted
│   ├── WirePath.tsx                      outline + core + draw progress + plugs
│   ├── DataPacket.tsx                    rectangular label riding a WirePath (§13)
│   ├── TechnicalLabel.tsx                counter-scaled callout with drawn leader line
│   ├── TelemetryBadge.tsx                "SAMPLE" / "TARGET HARDWARE" / "LIVE PROTOTYPE" chips
│   ├── HardShadow.tsx                    <use> offset (10,10) ink silhouette – replaces CSS drop-shadow
│   ├── PulseRing.tsx                     yellow ring pulse (radius + opacity from p)
│   └── Stamp.tsx                         rotated rectangular stamp (SIGNAL CONNECTED, NO PEOPLE DETECTED…)
├── overlays/                             HTML above the SVG
│   ├── Backgrounds.tsx                   bg-paper / bg-red / bg-dark + grid + grain + reg marks
│   ├── TitleOverlay.tsx                  SMART CLASSROOM, THE BRAIN, VISION LAYER (chapter titles)
│   ├── HudStrip.tsx                      "SYSTEM STATUS: …" + honesty strip (§6)
│   ├── SceneProgress.tsx                 14 ticks, click-to-jump (smooth scroll to chapter start)
│   ├── BootScene.tsx                     black terminal (Scene 13)
│   ├── ReadyScene.tsx                    ARE / YOU / READY? + CTA (Scene 14)
│   ├── BrutalistButton.tsx               the CTA button (§6 Scene 14)
│   ├── SkipIntro.tsx                     "SKIP INTRO →" link to "/"
│   └── DebugOverlay.tsx                  only if import.meta.env.DEV or ?debug=1
├── static/
│   └── StaticStoryboard.tsx              reduced-motion: 10 frozen sections (§15)
└── transition/
    └── dashboardTransition.ts            NOT a React component: imperative curtain that survives the route change (§17)
```

Mapping from the brief's tree: `IntroScene`, `Esp32Scene`, `SensorScene`, `SensorWireSystem`, `DataFlowScene`, `RelayScene`, `EnergyScene`, `VisionScene`, `DataExplosionScene`, `ComputerScene`, `Error404Scene`, `BootScene`, `ReadyScene`, `DashboardTransition` all exist. `LandingPage` = `IntroRoot` (renamed to avoid confusion with the existing dashboard "Page" naming).

---

## 6. SCENE-BY-SCENE STORYBOARD

### Persistent layers (every scene)
- **HUD strip** (top-left, HTML): ink-bordered paper plate, IBM Plex Mono 700, 12 px (desktop) / 11 px (mobile). Text `SYSTEM STATUS: <STATE>` + 10 px square status dot. States by progress: `OFFLINE` 0–14 (grey dot) · `BOOTING` 14–20 (yellow) · `ATTACHING SENSORS` 20–34 (yellow) · `WIRING` 34–40 (yellow) · `SENSING` 40–45.5 (cyan) · `ADDING CONTROL` 45.5–54 (yellow) · `CONTROLLING` 54–60 (green) · `VISION ONLINE` 60–70 (cyan) · `STREAMING TO HOST` 70–82 (cyan) · `CONNECTING` 82–87.4 (yellow) · `LINK LOST` 87.4–90 (**red plate, white text ≥ 14 px bold**) · `REBOOTING` 90–96 (yellow) · `READY` 96–96.2 (green), then hidden.
- **Honesty strip** (bottom-left, HTML, visible 8–95): ink plate, paper text, mono 11 px, single line: `PROTOTYPE STATUS · PIR + DHT11: SIMULATED · CAMERA: LIVE PHONE (RTSP) · ESP32 + RELAYS: TARGET HARDWARE`. On portrait it wraps to 2 lines, 10 px.
- **Chips** (`TelemetryBadge`, SVG, counter-scaled): `TARGET HARDWARE` (paper plate, ink border, dashed) attached to ESP32, PIR, DHT11, relays; `SAMPLE VALUES` (cyan plate) on packet scenes; `LIVE PROTOTYPE INPUT` (green plate) on the phone camera; `DEMO SEQUENCE · NOT LIVE STATUS` (yellow plate) on monitor/terminal.
- **SKIP INTRO →** (top-right, always focusable, first in tab order).
- **SceneProgress** ticks (right edge desktop; bottom edge portrait).
- No scene calls the network. No value on screen is fetched.

### Scene 01 — EMPTY CLASSROOM (p 0 – 8)
- **Background:** `bg-paper` `#F4F0E6`, grid 48 px @ 5 % ink, grain 4 %, registration marks (`+` crosses, 24 px) at the four corners inset 32 px.
- **World:** `ClassroomIllustration` centered at world (1200, 600), 1500 × 820. Hand-drawn ink line work, 4 px stroke, 2 % wobble on paths (pre-baked into the path data, not animated). Elements: back wall + floor line (y = 930), blackboard 620 × 190 (top-center) with chalk tray, **ceiling light batten** (420 × 36, top-center), door at left (120 × 370) with plate `ROOM 508`, three rows of desks × 5 each (front view; row scales 1.0 / 0.9 / 0.8) with chairs, wall clock (decorative, static hands). **Everything empty. No people.**
- **Overlay text:** `SMART` / `CLASSROOM` (Archivo 900, `--lp-display-xl`, two lines, left-aligned at 6 vw, vertically centered), sub-line `OCCUPANCY • ENVIRONMENT • ENERGY` (Plex Mono 700, 16–20 px, letter-spacing .18em), `SYSTEM STATUS: OFFLINE` in HUD, bottom-center `SCROLL TO BUILD THE CLASSROOM ↓` (mono 14 px, arrow bobbing 6 px on a **CSS loop that stops at p > 0.5** — the only non-scrub loop on the page, allowed because it is an affordance).
- **On scroll:** title translates up 0 → −60 px and fades 2.5 → 7; hint fades 0.5 → 2; camera drifts z 1.00 → 1.08; annotations draw in 3 → 7 (leader lines with `BOARD`, `DESK ROW`, `CEILING LIGHT`, `DOOR`; mono 13 px); from 7 the ESP32 peeks up from below the viewport.
- **Do not** reveal any hardware before p = 6.5.

### Scene 02 — ESP32 ARRIVAL (p 8 – 20; rise begins at 7)
- **Background:** unchanged. Room ghost drops to 16 % opacity over 8 → 14 so hardware reads as the foreground.
- **ESP32:** 240 × 440 portrait board (USB at the bottom edge, antenna at the top). Rises from world y = 1500 to 585 (p 7 → 13.5) while rotating +14° → −4° and scaling .92 → 1.00, then settles to (1200, 600), 0° (13.5 → 15.5). It does **not** spin.
- **Activation (15.3 – 16.3):** a **yellow power plate** (`#FFD83D`, 300 × 520, 4 px ink border) appears behind the board offset (−14, −14) (opposite the ink shadow), the power LED turns on, and 8 hard-edged yellow ray polygons kick out from the chip shield and retract by 17.
- **Text:** `THE BRAIN` (Archivo 900, ~8 vw, top-left) slides up 40 px while revealing through a clip mask, 11.5 → 13.5; out 19 → 21. `ESP32 DEVELOPMENT BOARD` (mono 700, 18 px) 14.5 → 15.5.
- **Callouts** (leader lines draw via dashoffset, label counter-scaled): `MCU` → shield can (15.4 – 16.2), `Wi-Fi` → antenna trace (16.1 – 16.9), `GPIO` → left pin header (16.8 – 17.6), `EDGE CONTROL` → bracket around whole board (17.5 – 18.3). Out 19.5 → 20.5. **No other labels.**
- **Camera:** pushes z 1.06 → 1.32 over 17 → 20 (composition stays centered on the ESP32).

### Scene 03 — PIR (p 20 – 27)
- Camera pulls back z 1.32 → 1.00 over 20 → 27.
- **PIR** (220 × 260) slides in from the LEFT: from world x = 0 to 735 (20 → 24.5), then back to 700 (24.5 → 26) — an overshoot of 35 units (≈ 5 %), **one** settle, no bounce. Rotation −8° → 0°. Three ink "motion ticks" trail it, opacity = normalized velocity.
- **Labels (24.8 – 26.5):** `MOTION` (display, mono 700 22 px) / `HC-SR501 PIR` / `MOTION / PRESENCE SIGNAL`. Chip `TARGET HARDWARE`.

### Scene 04 — DHT11 (p 27 – 34)
- **DHT11** (180 × 200, blue) slides in from the RIGHT: x 2300 → 1665 (27 → 31.5), settle to 1700 (31.5 → 33), rotation +8° → 0°.
- **Labels (31.8 – 33.5):** `ENVIRONMENT` / `DHT11` / `TEMPERATURE` `HUMIDITY`.
- **Composition at 33:** `PIR ← ESP32 → DHT11` at x = 700 / 1200 / 1700 on the same baseline (y = 600). Symmetric about x = 1200.

### Scene 05 — WIRES CONNECT (p 34 – 41)
- Each sensor has **three** independent wires (`sig`, `vcc`, `gnd`); each wire is an SVG path that draws itself with `stroke-dashoffset`. Never opacity.
- PIR wires draw 34 → 37.5 (staggered 0.5), DHT wires 36 → 39.5 (staggered 0.5). Wire construction, plugs and pulses: §12.
- Each `sig` wire completes with a **yellow pulse ring** at the ESP32 pad (PIR 36.5 → 37.4, DHT 38.5 → 39.4).
- **Stamp** `SIGNAL CONNECTED` (yellow plate, ink border, 6 px hard shadow, rotated −4°) appears 39.8 → 40.4, visible until 45. Scrolling back retracts the wires in reverse.

### Scene 06 — DATA PACKETS (p 41 – 45.5)
- Three rectangular packets ride the real `sig` wire paths (details §13): `MOTION: 1` (PIR wire), `TEMP: 28.4°C`, `HUMIDITY: 61%` (both on the DHT wire, sequential). Chip `SAMPLE VALUES` on-screen the whole time. ESP32 TX LED blinks with progress phase.
- Windows: MOTION 41 → 43.6, TEMP 41.8 → 44.4, HUMIDITY 42.6 → 45.2.

### Scene 07 — RELAYS (p 45 – 54)
- Camera pans down: (1200, 640, 1.05) at 45 → (1200, 940, 0.78) at 52.
- **Relay 01** enters from bottom-left, **Relay 02** from bottom-right (§8 for numbers); labels `RELAY 01` / `LIGHTS` (47.5 – 49) and `RELAY 02` / `AIR CONDITIONING` (48.5 – 50). Chip `TARGET HARDWARE`.
- ESP32 → relay signal wires **draw** (47.5 → 49.5 and 48.5 → 50.5) with pulses at the relay input pins. Footnote (mono 11 px, under relay row, 49 → 54): `SIGNAL WIRES ONLY · ILLUSTRATIVE · NOT A WIRING DIAGRAM`.
- **CLASSROOM LIGHT** (fixture) rises into position 49.5 → 52; **AC** rises 50.5 → 53.
- Relay → load wires draw 52 → 53.5 (light) and 53 → 54.5 (AC). As each closes, its relay lever snaps to ON and its load turns ON (§8): light rays ON 53.5 → 54.3, AC ON 54.3 → 55.

### Scene 08 — ENERGY CONTROL (p 54 – 60)
- Camera holds (1200, 940, 0.78) (linear drift ≤ 30 units).
- Top-center HTML stack (arrows between): `NO PEOPLE DETECTED` (55.2 – 55.9) ↓ `ROOM IDLE` (56.0 – 56.6) ↓ `ENERGY SAVE` (56.8 – 57.4). Stamps are ink-bordered rectangles; `ENERGY SAVE` uses a yellow plate.
- Under it, a **SENSE → DECIDE → ACT** chip row (SVG/HTML, mono 700): each chip fills yellow when active — SENSE 55.2, DECIDE 56.4, ACT 57.6 — with arrows that draw between. `DECIDE` is intentionally generic. **Do not label it "ESP32 decision" or "AI"**: in the real architecture the backend rule engine and the command queue decide (SPEC D8).
- PIR sends packet `MOTION: 0` (55.0 → 56.4) to the ESP32. Two `CMD: OFF` packets travel ESP32 → Relay 01 and Relay 02 along the relay signal wires (57.4 → 58.6). Relay levers flip to OFF (58.3 → 59.1). **Light** rays retract and fill goes yellow → paper (58.6 → 59.2). **AC** flap closes, cool streaks retract, LED goes dark (59.0 → 59.6). Labels `LIGHT → OFF` (59.2 → 59.9) and `AC → OFF` (59.6 → 60).

### Scene 09 — CAMERA / YOLO11n (p 60 – 70)
- Camera pans right: (1200, 940, 0.78) at 60 → (2790, 700, 1.00) at 63, then a slow push to z 1.08 by 70.
- **Title** `VISION LAYER` in 61.5 → 63; out 69 → 70.2.
- **Phone camera** (generic smartphone on a small tripod, ~150 × 300; no brand marks; label `CAMERA INPUT · iPHONE (PROTOTYPE)`; chip `LIVE PROTOTYPE INPUT`) slides in from the right (61 → 63.5).
- **Frame window** (520 × 340 viewport with a mini classroom silhouette, `REC ●` tag) opens vertically from its center line (62.5 → 63.8).
- `RTSP` wire draws from phone to frame (63.5 → 64.5).
- **Pipeline chips row** below: `RTSP` → `OpenCV` → `YOLO11n` → `FastAPI` (arrows draw between). Chips fill yellow in order as the pipeline "runs": RTSP 64.5, OpenCV 65.3, YOLO11n 66.5 – 68.4, FastAPI 68.5.
- **Person:** anonymous, faceless ink silhouette walks in from the left of the frame (64 → 66.5), stops. **Detection box:** four corner brackets + rectangle in cyan draw 66.5 → 67.3. Label plate `PERSON` + `CONFIDENCE 0.94` (66.5 → 68.2), tagged `SAMPLE`. Count plate `1 PERSON` (68.4 → 69.6) and a green `OCCUPIED` stamp (69.0 → 69.8).
- **Privacy stamp** `NO FACE RECOGNITION · COUNT ONLY` (67.5 → 70.5).
- **Story beat D-6:** at 69.4 → 69.9 Relay 01 lever flips back to ON and the light turns ON (69.9 → 70.8) as the camera pulls back. AC stays OFF.
- **Never** draw a face, name, or ID.

### Scene 10 — DATA EXPLOSION (p 70 – 82)
- Camera pulls back to (1500, 1400, 0.45) at 73. The monitor rises into view (70.5 → 73), bottom-center.
- **Seven trunk lines** (§12.3) draw outward from their sources toward the monitor's ports (windows in §7.2), with dashed cyan flow inside each black trace. Labeled packets ride them (76 → 80.6): ESP32 `POST /api/sensor-data`, PIR `OCCUPANCY: 1`, DHT `TEMP: 28.4`, DHT `HUMIDITY: 61`, Relay 1 `LIGHT: ON`, Relay 2 `AC: OFF`, YOLO `YOLO: 1 PERSON`. Each port fills yellow on arrival. Chip `SAMPLE VALUES`.
- **No particles.** 7 paths + 7 packets total.

### Scene 11 — COMPUTER (p 82 – 87.4)
- Camera pushes (1500, 1400, 0.45) → (1200, 1900, 1.10) at 85.5 → 1.25 at 87.4 (monitor screen fills ≈ 85 % of the viewport width).
- Monitor: chunky neo-brutalist CRT-free flat monitor with thick bezel, stand and small keyboard silhouette. Lines enter the ports on the bezel's top edge and sides.
- Screen (ink `#111` with paper text, mono): `CONNECTING...` from 81 (dots cycle by progress phase), then check lines typed with dot leaders and green `OK`:
  `SENSORS ........ OK` (83.2), `ESP32 .......... OK` (83.9), `CAMERA ......... OK` (84.6), `YOLO11n ........ OK` (85.3), `DATABASE ....... OK` (86.0). Chip `DEMO SEQUENCE · NOT LIVE STATUS` (D-5).
- 87.0 → 87.6: cracks draw across the screen; shake begins at 87.4.

### Scene 12 — 404 (p 87.4 – 90) — theatrical only
- **Background cut** to `#E53935` (87.9 → 88.05). HUD → `LINK LOST` (red plate).
- Screen content swaps hard (steps) at 88.0: `404` (Archivo 900, paper on ink), `CLASSROOM` / `NOT FOUND`, `SYSTEM RESPONSE INTERRUPTED` (mono). **All small text sits on ink or paper plates, never directly on red** (contrast, §15).
- Effects (all deterministic from p): screen shake amplitude 14 → 0 px (88 → 89.5); 3 horizontal slice displacements of the `404` text (±6…28 px, `hash01(floor(p·8))`); one scanline bar sweeping top→bottom (88.2 → 89.4); four black/red blocks flicker (steps).
- 89.5 → 90.0: `SYSTEM REBOOT` bar (mono 700, paper on ink) slides in across the screen. It is **decoration only**: no throw, no route change, no `NotFoundPage`, no `document.title` change, no console errors.

### Scene 13 — SYSTEM REBOOT (p 90 – 96)
- bg red → dark `#111111` (90.0 → 90.4). Camera pushes into the (now black) screen z 1.25 → 2.6 (90 → 92).
- The HTML terminal (`BootScene`, `bg #111`, mono 600, paper text, `clamp(16px, 2.2vw, 28px)`) takes over: the SVG monitor is hidden from 92.4.
- Blinking cursor `_` (blink phase = `floor(p·30) % 2`) from 91.4. Typed line `INITIALIZING SMART CLASSROOM...` (92.2 → 93.3). Check lines, each with a green `✓` (`#35C759`, pop 1.4 → 1 over 0.2): `SENSORS` 93.3, `ESP32` 93.65, `CAMERA` 94.0, `YOLO11n` 94.35, `OCCUPANCY` 94.7, `ENERGY` 95.05, `ANALYTICS` 95.4. `SYSTEM READY` plate (yellow `#FFD83D`, ink text) 95.6 → 96.0. Tag `DEMO SEQUENCE · NOT LIVE STATUS`.
- 96.0 → 96.6: terminal fades, `bg-dark` → `bg-paper`.

### Scene 14 — ARE YOU READY? (p 96 – 100)
- Everything else is hidden. `ARE` / `YOU` / `READY?` in Archivo 900, `--lp-display-xl`, centered, three lines, `line-height .86`, text with hard 8 px ink `text-shadow` (READY? in yellow). Each line reveals via a bottom-up clip mask: ARE 96.6 → 97.1, YOU 97.0 → 97.5, READY? 97.4 → 97.9.
- Sub-line `ENTER THE CLASSROOM` (mono 700, letter-spacing .2em) 98.0 → 98.6.
- **CTA** `INITIALIZE DASHBOARD →` rises 30 px → 0 and fades in 98.4 → 99.1; **enabled** (pointer events, `tabindex=0`, `aria-hidden=false`) at p ≥ 98.8; before that it is `visibility:hidden`.
- **Button:** rectangular, `#FFD83D` face (or `#F4F0E6` on hover-free variants), 4 px `#111` border, radius 0, hard shadow `8px 8px 0 #111`, Archivo 900 22–28 px, padding 20 × 36. Hover: `translate(4px, 4px)` and shadow → `4px 4px 0` (150 ms). Active: `translate(8px, 8px)`, shadow `0 0 0`. **Never `scale()`.** Focus-visible: 3 px ink outline offset 4 px. Min height 64 px (touch).

### Scene 15 — DASHBOARD TRANSITION (click, time-based, ≈ 1.1 s)
Specified in §17.

---

## 7. EXACT SCROLL TIMELINE

### 7.1 Chapters (`CH`, percent of total progress)

| Chapter | Scene(s) | Start | End | Scroll length @ 900 px tall |
|---|---|---|---|---|
| intro | 01 | 0 | 8 | ≈ 1 010 px |
| esp32 | 02 | 8 (rise starts 7) | 20 | ≈ 1 510 px |
| pir | 03 | 20 | 27 | ≈ 880 px |
| dht | 04 | 27 | 34 | ≈ 880 px |
| wires | 05 | 34 | 41 | ≈ 880 px |
| packets | 06 | 41 | 45.5 | ≈ 570 px |
| relays | 07 | 45 | 54 | ≈ 1 130 px |
| energy | 08 | 54 | 60 | ≈ 760 px |
| vision | 09 | 60 | 70 | ≈ 1 260 px |
| explode | 10 | 70 | 82 | ≈ 1 510 px |
| computer | 11 | 82 | 87.4 | ≈ 680 px |
| glitch | 12 | 87.4 | 90 | ≈ 330 px (short by design) |
| reboot | 13 | 90 | 96 | ≈ 760 px |
| ready | 14 | 96 | 100 | ≈ 500 px |

(Total scrollable ≈ 12 600 px at 900 px viewport height = 1 400 vh.)

### 7.2 Windows (`W`) — every animation window, one source of truth

| Key | [start, end] | Key | [start, end] |
|---|---|---|---|
| introHintOut | 0.5 – 2 | pirWirePulse | 36.5 – 37.4 |
| introTitleOut | 2.5 – 7 | dhtWireSig / Vcc / Gnd | 36 – 38.5 / 36.5 – 39 / 37 – 39.5 |
| introAnnot | 3 – 7 | dhtWirePulse | 38.5 – 39.4 |
| esp32Rise | 7 – 13.5 | signalConnectedStamp | 39.8 – 40.4 (stays to 45) |
| esp32Settle | 13.5 – 15.5 | pktMotion / Temp / Hum | 41 – 43.6 / 41.8 – 44.4 / 42.6 – 45.2 |
| roomGhost | 8 – 14 | relay1In / relay2In | 45 – 47.5 / 46 – 48.5 |
| brainTitleIn / Out | 11.5 – 13.5 / 19 – 21 | relay1Sig / relay2Sig | 47.5 – 49.5 / 48.5 – 50.5 |
| esp32Activation | 15.3 – 16.3 | relayLabels | 47.5 – 50 |
| calloutMcu / Wifi / Gpio / Edge | 15.4 – 16.2 / 16.1 – 16.9 / 16.8 – 17.6 / 17.5 – 18.3 | lightIn / acIn | 49.5 – 52 / 50.5 – 53 |
| cameraPush | 17 – 20 | load1Wire / load2Wire | 52 – 53.5 / 53 – 54.5 |
| pirInA / pirInB | 20 – 24.5 / 24.5 – 26 | lever1On / lever2On | 53 – 53.5 / 53.9 – 54.3 |
| pirLabels | 24.8 – 26.5 | lightOn / acOn | 53.5 – 54.3 / 54.3 – 55 |
| dhtInA / dhtInB | 27 – 31.5 / 31.5 – 33 | noPeople / roomIdle / energySave | 55.2 – 55.9 / 56 – 56.6 / 56.8 – 57.4 |
| dhtLabels | 31.8 – 33.5 | senseChip / decideChip / actChip | 55.2 / 56.4 / 57.6 (activation points) |
| pirWireSig / Vcc / Gnd | 34 – 36.5 / 34.5 – 37 / 35 – 37.5 | pktMotion0 | 55 – 56.4 |
| cmdOffPackets | 57.4 – 58.6 | lever1Off / lever2Off | 58.3 – 58.8 / 58.6 – 59.1 |
| lightOff / acOff | 58.6 – 59.2 / 59 – 59.6 | loadLabels | 59.2 – 59.9 / 59.6 – 60 |
| visionTitleIn / Out | 61.5 – 63 / 69 – 70.2 | phoneIn | 61 – 63.5 |
| frameOpen | 62.5 – 63.8 | rtspWire | 63.5 – 64.5 |
| personWalk | 64 – 66.5 | detectBox | 66.5 – 67.3 |
| detectLabel | 66.5 – 68.2 | countPlate / occupiedStamp | 68.4 – 69.6 / 69.0 – 69.8 |
| privacyStamp | 67.5 – 70.5 | lever1BackOn / lightBackOn | 69.4 – 69.9 / 69.9 – 70.8 |
| monitorRise | 70.5 – 73 | lineEsp32 / Pir / Relay1 / Relay2 | 70.5 – 72.5 / 70.8 – 74.5 / 71.2 – 73.6 / 71.6 – 74 |
| lineDhtTemp / DhtHum / Yolo | 72 – 76 / 72.4 – 76.4 / 72.8 – 77.5 | dataPackets (staggered 0.4) | 76 – 80.6 |
| computerPush | 82 – 87.4 | connecting | 81 – 83 |
| checks (5 lines) | 83.2, 83.9, 84.6, 85.3, 86.0 (each 0.6 long) | crack | 87.0 – 87.6 |
| shake | 87.4 – 89.5 | redCut | 87.9 – 88.05 |
| screen404Swap | 88.0 (step) | scanline | 88.2 – 89.4 |
| interruptedText | 88.6 – 89.6 | rebootBar | 89.5 – 90.0 |
| darkCut | 90.0 – 90.4 | pushIntoScreen | 90 – 92 |
| cursorBlink | 91.4 – 92.2 | typedInit | 92.2 – 93.3 |
| bootChecks | 93.3 + 0.35·i (i = 0..6) | systemReady | 95.6 – 96.0 |
| terminalFade / paperReturn | 96.0 – 96.6 | ready ARE / YOU / READY? | 96.6 – 97.1 / 97.0 – 97.5 / 97.4 – 97.9 |
| readySub | 98.0 – 98.6 | ctaIn / ctaEnabled | 98.4 – 99.1 / ≥ 98.8 |

### 7.3 Camera keyframes — landscape `(cx, cy, z)`

| p | cx | cy | z | Easing to next |
|---|---|---|---|---|
| 0 | 1200 | 610 | 1.00 | linear (hold to 2) |
| 8 | 1200 | 600 | 1.08 | inOutSine |
| 14 | 1200 | 600 | 1.06 | linear (hold to 17) |
| 20 | 1200 | 590 | 1.32 | inOutCubic (push 17 → 20) |
| 27 | 1200 | 600 | 1.00 | inOutCubic (pull back) |
| 41 | 1200 | 600 | 1.00 | linear |
| 45 | 1200 | 640 | 1.05 | inOutCubic (pan down) |
| 52 | 1200 | 940 | 0.78 | linear (drift) |
| 60 | 1200 | 950 | 0.78 | inOutCubic (pan right) |
| 63 | 2790 | 700 | 1.00 | linear (slow push) |
| 70 | 2790 | 700 | 1.08 | inOutCubic (pull back) |
| 73 | 1500 | 1400 | 0.45 | linear |
| 82 | 1500 | 1400 | 0.45 | inOutCubic (push to monitor) |
| 85.5 | 1200 | 1900 | 1.10 | linear |
| 87.4 | 1200 | 1900 | 1.25 | linear (+ shake offset 87.4–89.5) |
| 90 | 1200 | 1900 | 1.25 | inOutCubic (push into screen) |
| 92 | 1200 | 1900 | 2.60 | — (world hidden after 92.4) |

Portrait camera keyframes: same progress values; use `PORTRAIT.camera` in `layout.ts` (§14).

### 7.4 Scene table (all 15)

| Scene | Scroll Progress | Main Object | Initial State | Animation | Final State | Background | Transition |
|---|---|---|---|---|---|---|---|
| 01 Empty Classroom | 0 – 8 | Classroom illustration + `SMART CLASSROOM` title | Full room, all empty, title solid, status OFFLINE | Title drifts up 60 px + fades (2.5–7); camera z 1.00 → 1.08; annotations draw (3–7); hint fades (0.5–2) | Room centered, title gone, ESP32 tip peeking at bottom edge | `#F4F0E6` paper + grid + grain | Hardware enters from below; room ghosts to 16 % (8–14) |
| 02 ESP32 Arrival | 8 – 20 | ESP32 board | Below viewport (y 1500), rot +14°, scale .92 | Rise + de-rotate (7–13.5); settle (13.5–15.5); yellow plate + LED (15.3–16.3); 4 callouts (15.4–18.3); camera push 17–20 | Centered (1200, 600), 0°, plate + callouts out by 20.5 | Paper | Camera pulls back as PIR enters from left |
| 03 PIR | 20 – 27 | PIR sensor | x = 0 (off-screen left) | Slide to 735 (20–24.5), settle to 700 (24.5–26); labels in (24.8–26.5) | Left of ESP32 at (700, 600) | Paper | DHT begins entering at 27 |
| 04 DHT11 | 27 – 34 | DHT11 sensor | x = 2300 (off-screen right) | Slide to 1665 (27–31.5), settle to 1700 (31.5–33); labels (31.8–33.5) | `PIR ← ESP32 → DHT11`, symmetric | Paper | PIR wires start drawing at 34 |
| 05 Wires | 34 – 41 | 6 sensor wires | Path length 0 (invisible) | Draw sig/vcc/gnd (34–39.5); plugs snap on at each end; pulse rings (36.5, 38.5); stamp (39.8–40.4) | All 6 wires 100 % drawn, `SIGNAL CONNECTED` shown | Paper | First packet leaves PIR at 41 |
| 06 Data Packets | 41 – 45.5 | 3 packets | Not visible | Travel along `sig` wires (41–45.2); absorbed by ESP32; TX LED blinks | Packets consumed; wires idle; `SAMPLE VALUES` chip | Paper | Camera pans down; relays enter at 45 |
| 07 Relays | 45 – 54 | Relay 01 / Relay 02, Light, AC | Off-screen bottom-left / bottom-right / below | Relays fly in (45–48.5); sig wires draw (47.5–50.5); light/AC rise (49.5–53); load wires draw (52–54.5); levers ON, loads ON (53–55) | ESP32 → relays → light + AC, both loads ON | Paper | Energy sequence begins 55 |
| 08 Energy Control | 54 – 60 | Light + AC + SENSE/DECIDE/ACT chips | Light ON, AC ON | `MOTION: 0` packet (55–56.4); stamps (55.2–57.4); chips activate; `CMD: OFF` packets (57.4–58.6); levers flip (58.3–59.1); light off (58.6–59.2); AC off (59–59.6) | Light OFF, AC OFF, labels shown | Paper | Camera pans right at 60 |
| 09 Camera / YOLO11n | 60 – 70 | Phone camera + frame + person + YOLO box | Off-screen right | Phone slides in (61–63.5); frame opens (62.5–63.8); RTSP wire (63.5–64.5); person walks (64–66.5); box (66.5–67.3); labels (66.5–69.8); light back ON (69.4–70.8) | `1 PERSON` + `OCCUPIED`, privacy stamp, light ON | Paper | Camera pulls back at 70 |
| 10 Data Explosion | 70 – 82 | 7 trunk lines + monitor rise | Hardware assembled, no lines | Monitor rises (70.5–73); lines draw outward (70.5–77.5); packets ride (76–80.6); ports light | All 7 lines connected to monitor ports | Paper | Camera pushes to monitor at 82 |
| 11 Computer | 82 – 87.4 | Monitor + screen | Screen dark/blank, z .45 | Push to z 1.25; `CONNECTING...`; 5 check lines; cracks (87–87.6) | Cracked screen, shaking | Paper (halftone under monitor) | Red cut at 87.9 |
| 12 404 | 87.4 – 90 | Monitor screen | Cracked, shaking | Hard cut to red; `404` + slices + scanline + blocks; `SYSTEM REBOOT` bar (89.5–90) | `SYSTEM REBOOT` on screen | `#E53935` | Dark cut 90.0–90.4 |
| 13 System Reboot | 90 – 96 | Terminal | Black screen, world zooming in | Push into screen (90–92); cursor; typed init line; 7 `✓` checks; `SYSTEM READY` plate | `SYSTEM READY` on terminal | `#111111` | Paper returns 96.0–96.6 |
| 14 Are You Ready? | 96 – 100 | Title + CTA | Nothing on screen | 3 title lines reveal (96.6–97.9); sub-line (98–98.6); CTA rises + enables (98.4–99.1) | `ARE / YOU / READY?` + `INITIALIZE DASHBOARD →` | `#F4F0E6` | Click starts Scene 15 |
| 15 Dashboard Transition | click (~1.1 s) | Curtain + `navigate('/')` | CTA idle | Press → monitor-shaped window opens → fills viewport → route change → curtain fades | Real dashboard at `/` | Curtain `#F4F1EA` (dashboard paper) | Seamless into existing dashboard |

---

## 8. EXACT ANIMATION BEHAVIOR FOR EVERY MAJOR OBJECT

Conventions: positions are world coordinates (landscape); **every row is a pure function of `p`, so every row reverses exactly by scrolling up**; `ease` names are from `easing.ts`; "hidden" means `visibility:hidden` (culling), used from 1.5 before the entry window.

| Object | Entry | Position | Rotation | Scale | Opacity | Trigger | Duration / Progress | Easing | Reverse |
|---|---|---|---|---|---|---|---|---|---|
| **ESP32** | Rises from below the viewport | (1200, 1500) → (1200, 585) → (1200, 600) | +14° → −4° → 0° | .92 → 1.00 | 1 (hidden before 5.5) | Scroll | 7 – 13.5, settle 13.5 – 15.5 | outCubic, then inOutSine | Yes: sinks back down |
| ESP32 activation plate | Pops behind board | offset (−14, −14) | 0° | .6 → 1.0 | 0 → 1 | Scroll | 15.3 – 16.3 | outCubic | Yes |
| **PIR** | Slides from left, one overshoot | x 0 → 735 → 700; y 620 → 600 | −8° → 0° | 1 | 1 (hidden before 18.5) | Scroll | 20 – 24.5, settle 24.5 – 26 | outCubic; inOutSine | Yes |
| **DHT11** | Slides from right, one overshoot | x 2300 → 1665 → 1700; y 620 → 600 | +8° → 0° | 1 | 1 (hidden before 25.5) | Scroll | 27 – 31.5, settle 31.5 – 33 | outCubic; inOutSine | Yes |
| **Sensor wires** (PIR ×3, DHT ×3) | Draw from sensor connector to ESP32 pad | fixed paths (§12) | — | — | 1 (visible from window start) | Scroll | PIR sig 34 – 36.5 · vcc 34.5 – 37 · gnd 35 – 37.5; DHT sig 36 – 38.5 · vcc 36.5 – 39 · gnd 37 – 39.5 | linear | Yes: retract toward sensor |
| Wire plugs (Dupont ends) | Scale-pop at path end | at each end pad | — | 0 → 1 (overshoot 1.15) | 1 | Scroll | last 0.3 of each wire window | outCubic | Yes |
| Pulse rings | Ring expands at ESP32 pad | pad position | — | radius 8 → 46 | 1 → 0 | Scroll | 36.5 – 37.4 and 38.5 – 39.4 | outCubic | Yes |
| **Data packets** (Motion, Temp, Hum) | Pop at sensor end, ride wire, absorbed at ESP32 | `getPointAtLength(u·L)` along `sig` path | 0° (stay upright) | 0 → 1 (first 8 %), 1 → 0 (last 10 %) | 1 | Scroll | 41 – 43.6 / 41.8 – 44.4 / 42.6 – 45.2 | inOutSine | Yes: travels backward |
| **Relay 01** | Flies from bottom-left | (200, 1460) → (715, 1055) → (700, 1060) | −10° → 0° | 1 | 1 (hidden before 43.5) | Scroll | 45 – 46.9, settle 46.9 – 47.5 | outCubic; inOutSine | Yes |
| **Relay 02** | Flies from bottom-right | (2200, 1460) → (1685, 1055) → (1700, 1060) | +10° → 0° | 1 | 1 (hidden before 44.5) | Scroll | 46 – 47.9, settle 47.9 – 48.5 | outCubic; inOutSine | Yes |
| Relay signal wires | Draw ESP32 → relay input | §12 | — | — | 1 | Scroll | R1 47.5 – 49.5 · R2 48.5 – 50.5 | linear | Yes |
| Relay levers (armature icon) | Flip | pivot at cube | ON −22° ↔ OFF +22° | 1 | 1 | Scroll | R1 ON 53–53.5, OFF 58.3–58.8, back ON 69.4–69.9 · R2 ON 53.9–54.3, OFF 58.6–59.1 | inOutCubic | Yes |
| **Classroom light** | Rises into place | (400, 1560) → (400, 1360) | 0° | .8 → 1 | 1 (hidden before 48) | Scroll | 49.5 – 52 | outCubic | Yes |
| Light state | Rays extend / retract | ray polygons scaleY 0 ↔ 1 from fixture; body fill paper ↔ yellow | — | — | — | Scroll | ON 53.5–54.3 · OFF 58.6–59.2 · ON 69.9–70.8 | inOutCubic | Yes |
| **AC** | Rises into place | (2000, 1580) → (2000, 1380) | 0° | .8 → 1 | 1 (hidden before 49) | Scroll | 50.5 – 53 | outCubic | Yes |
| AC state | Flap opens/closes, streaks draw, LED green ↔ off | flap rotation −35° ↔ 0°; 3 streak paths dashoffset | — | — | — | Scroll | ON 54.3–55 · OFF 59–59.6 | inOutCubic | Yes |
| Load wires | Draw relay → load | §12 | — | — | 1 | Scroll | 52 – 53.5 / 53 – 54.5 | linear | Yes |
| Energy stamps + SENSE/DECIDE/ACT | Stamp-in (scale 1.3 → 1, rot −3°) | HTML top-center | −3° → 0° | 1.3 → 1 | 0 → 1 (stamp only, quick) | Scroll | §7.2 | outCubic | Yes |
| **Phone camera** | Slides from right | (2840, 760) → (2440, 760) | +6° → 0° | 1 | 1 (hidden before 59.5) | Scroll | 61 – 63.5 | outCubic | Yes |
| Camera frame | Opens from center line | (2900, 620) | 0° | scaleY 0 → 1 | 1 | Scroll | 62.5 – 63.8 | outCubic | Yes |
| Person silhouette | Walks in | frame-local x −120 → 0 | 0° | 1 | 1 | Scroll | 64 – 66.5 (walk bob = `steps(2)` of progress) | linear | Yes: walks out |
| **YOLO box** | Corner brackets snap + rectangle draws | tight around person, frame-local | — | brackets 1.4 → 1 | 1 | Scroll | 66.5 – 67.3 (label 66.5–68.2) | outCubic | Yes |
| **Data lines** (7) | Draw outward from source to port | §12.3 | — | — | 1 | Scroll | 70.5 – 77.5 (per line, §7.2) | linear | Yes: retract to source |
| Data-line flow dashes | Continuous dash travel | along trace | — | — | 1 | Scroll | 74 – 82 (`dashoffset = −p·60`) | linear | Yes (moves backward) |
| **Monitor** | Rises from below, then camera pushes in | group translateY +300 → 0 (final: body center x 1200, screen center (1200, 1900)) | 0° | 1 | 1 (hidden before 69) | Scroll | 70.5 – 73 | outCubic | Yes |
| Screen content | Text/lines typed by progress | — | — | — | per line | Scroll | §7.2 | steps | Yes |
| **404 screen** | Hard swap + glitch | slices ±6…28 px | 0° | 1 | 0 → 1 (step) | Scroll | 88.0 swap; glitch 88 – 89.6 | steps | Yes: returns to the check-list screen |
| **Boot text** | Typed / revealed by progress | HTML terminal | 0° | 1 | 1 | Scroll | 91.4 – 96.0 | steps | Yes: un-types |
| **CTA** | Rises + fades in, then enabled | translateY 30 → 0 px | 0° | 1 | 0 → 1 | Scroll | 98.4 – 99.1; enabled ≥ 98.8 | outCubic | Yes: hides, disables |

> **Monitor geometry:** body 1200 × 720 at x 600 – 1800, y 1560 – 2280; screen 1080 × 608 inside it at x 660 – 1740, y 1600 – 2208 (screen center ≈ (1200, 1900), the camera target); stand/keyboard to y ≈ 2400. It rises by animating its group `translateY` from +300 to 0 over 70.5 – 73.

---

## 9. EXACT COLOR TOKENS

Defined in `components/intro/intro.css` on `.lp-root` (scoped; **never** in the global `@theme`):

```css
.lp-root {
  /* Required by the brief */
  --lp-paper:  #F4F0E6;   /* main engineering paper */
  --lp-ink:    #111111;   /* outlines, borders, type, structure */
  --lp-yellow: #FFD83D;   /* ESP32 activation, energy, CTA */
  --lp-cyan:   #27C7E8;   /* data packets, telemetry, digital signals */
  --lp-green:  #35C759;   /* successful system states */
  --lp-red:    #E53935;   /* 404 scene, critical states ONLY */
  --lp-blue:   #356AE6;   /* secondary technical information */
  /* Derived neutrals (no new hues) */
  --lp-paper-lite:  #FBF8F0;  /* PIR dome, AC body, plates */
  --lp-paper-shade: #E6E0D0;  /* halftone, hatching, grid tint */
  --lp-metal:       #CFCABC;  /* ESP32 shield can, screw heads */
  --lp-pcb:         #26262B;  /* PCB bodies (with paper keyline, see §11) */
  --lp-grid:        rgba(17,17,17,.05);
  --lp-grain:       rgba(17,17,17,.04);
  --lp-shadow-hard: 8px 8px 0 var(--lp-ink);
}
```

**Usage rules**

| Color | Use | Never use |
|---|---|---|
| Ink `#111` | All outlines (8 units major / 4 units detail), wires' outer stroke, type, hard shadows, terminal background | Large flat fills except monitor screen, PCBs (via `--lp-pcb`), terminal |
| Paper `#F4F0E6` | Main background, plates, paper keylines on dark objects | — |
| Yellow `#FFD83D` | ESP32 activation plate, energy stamps, `SIGNAL CONNECTED`, pulse rings, light ON, pipeline-chip "active" fill, CTA face, `SYSTEM READY` plate | Body text |
| Cyan `#27C7E8` | Data packets, `sig` wire cores (DHT), data-line flow dashes, YOLO box | Backgrounds |
| Green `#35C759` | `OK`, `✓`, `OCCUPIED`, READY, live-prototype chip | Decoration |
| Red `#E53935` | Scene 12 background + 404 blocks + `LINK LOST` plate | Any scene outside 87.4 – 90.4 (and the HUD plate in that window) |
| Blue `#356AE6` | DHT11 body, relay cubes and terminals, `POST /api/sensor-data` tag, secondary chips | Black text on blue |

**Contrast rules (WCAG AA, measured):** `#E53935` vs `#111` ≈ 4.5:1 and vs white ≈ 4.2:1, so **no small text may sit directly on red**. On the red background all text is ≥ 24 px bold, or sits on an ink/paper plate. Blue `#356AE6` is used with paper/white text only (≈ 4.7:1). Black on yellow, cyan, green is well above 7:1.

**Page is primarily ink on paper.** In any single frame, at most **two** accent colors dominate. Yellow + cyan is the default pair; red and green never share a frame except the boot ✓ marks on dark.

## 10. TYPOGRAPHY SYSTEM

Both families are **already installed**. The intro stylesheet imports only what it needs:

```css
@import "@fontsource/archivo/latin-800.css";
@import "@fontsource/archivo/latin-900.css";
/* IBM Plex Mono 600/700 are already loaded globally by index.css */
```

| Role | Family / weight | Size | Notes |
|---|---|---|---|
| Display XL (`SMART`, `CLASSROOM`, `ARE / YOU / READY?`) | Archivo 900, uppercase | `--lp-display-xl: clamp(64px, 13vw, 220px)` | `line-height .86`, `letter-spacing -.02em`, hard `text-shadow: 8px 8px 0 #111` on READY? only |
| Display L (`THE BRAIN`, `VISION LAYER`) | Archivo 900 | `clamp(44px, 8vw, 140px)` | Same treatment, no shadow |
| Stamp / plate title (`SIGNAL CONNECTED`, `NO PEOPLE DETECTED`, `404`) | Archivo 800 | 20–28 px (`404` on screen: 260 units) | Uppercase, in ink-bordered plates |
| Chapter tag / callout label | Plex Mono 700 | 13–16 px (SVG labels counter-scaled to ≥ 13 px) | Uppercase, `letter-spacing .12em` |
| Telemetry (`MOTION: 1`, `TEMP: 28.4°C`, `HUMIDITY: 61%`, `YOLO11n`, `CONNECTING...`, terminal) | Plex Mono 600/700 | 14 px packets; terminal `clamp(16px, 2.2vw, 28px)` | Tabular numerals; text always uppercase except unit symbols |
| HUD / honesty strip | Plex Mono 700 | 12 px (11 px mobile, 10 px honesty strip on mobile) | On paper or ink plates |
| CTA | Archivo 900 | 22–28 px | `letter-spacing .04em` |

Rules: **no third family**; no italics; no font smaller than 10 px; SVG `<text>` sets `font-family` explicitly (`Archivo` / `IBM Plex Mono`) with a system fallback; text in SVG is counter-scaled (§4.4); all display type uses `text-transform: uppercase` in CSS, not in source strings, so screen readers read normal case.

## 11. HARDWARE ASSET REQUIREMENTS

### 11.1 Strategy
**Hand-authored SVG React components, no raster assets.** They must remain independently controllable (position, rotation, scale, sub-part state), vector-crisp at zoom .45 – 2.6, and ≤ 30 KB total. **No image files, no generated PNGs.**

### 11.2 Global illustration rules
- Major outline 8 units, detail outline 4 units, `stroke-linejoin: round`, `stroke-linecap: round` (butt on wire outer strokes).
- **Hard shadow:** `HardShadow` = the object's silhouette `<use>` filled ink, translated (12, 12). **No `filter`, no `drop-shadow`, no blur anywhere.**
- Flat fills only, from §9. Halftone shading via one shared SVG `<pattern>` (dots r = 1.6, pitch 8, `--lp-paper-shade`) on the shaded side of objects.
- **Dark objects** (`--lp-pcb`) get an inset paper keyline (3 units, inset 10) so they read against the ink shadow.
- Hand-drawn feel comes from **pre-baked wobble in path data** (max 2 units), not runtime filters.
- Each hardware component: `export const Xxx: React.FC<{ }>` returning one `<g>` whose **origin is the object's visual center**, with named child groups (ids below) so tracks can address sub-parts by ref.
- Objects are **technically recognizable, never mascots**: no eyes, no faces, no arms.
- No brand logos or trademarked marks. The phone is a generic smartphone.

### 11.3 Objects

| Object | World size (w × h) | Must visibly include | Named sub-groups (refs) | Pin / anchor points (object-local, origin = center) |
|---|---|---|---|---|
| **ESP32 dev board** | 240 × 440 | Dark PCB; silver **shield can** module (upper half) with **meander antenna trace** at the top end; two vertical **pin headers** (left + right, ≈ 19 pads each, gold/yellow); **micro-USB** port at bottom edge; two small tact buttons + CP2102-style chip near USB; red power LED + blue TX LED; silkscreen lines; 4 mounting-free corners | `esp32__pcb`, `__shield`, `__antenna`, `__pinsL`, `__pinsR`, `__usb`, `__ledPower`, `__ledTx`, `__plate` (yellow activation plate) | Left pads x = −108: 3V3 y −150, GPIO27 y −40, GND y +120, GPIO25 y +180; right pads x = +108: 3V3 −150, GPIO4 −40, GND +120, GPIO26 +180. **Do not print pin names on the board** (illustrative pinout). |
| **PIR HC-SR501** | 220 × 260 | Dark PCB; large white **Fresnel dome** (paper-lite, ~10 facet lines), PCB rim beneath the dome, two **trim-pot** bodies (yellow) labelled by icons only, 3-pin header (VCC / OUT / GND) | `pir__pcb`, `__dome`, `__pots`, `__pins` | Pins on right edge x = +118: VCC y +10, OUT y +40, GND y +70; data-line out (0, +135) |
| **DHT11** | 180 × 200 | **Blue** perforated plastic body (grid of 4 × 6 slots), 4 legs (VCC, DATA, NC, GND) on a small breakout with pull-up resistor | `dht__body`, `__slots`, `__legs`, `__breakout` | Left edge x = −98: VCC y −30, DATA y 0, GND y +30; data-line outs (40, +102) and (80, +102) |
| **Relay module** (×2) | 260 × 190 | Dark PCB, **blue relay cube** (SRD-05VDC style, silkscreen icon only), blue **screw terminal** block with 3 slotted screws (COM/NO/NC), 3-pin input header (VCC / GND / IN), small red LED, opto chip | `relay__pcb`, `__cube`, `__terminals`, `__inHeader`, `__led`, `__lever` (schematic armature icon on a small cut-away inset, pivot for flip) | IN pad top (0, −95); load terminal out (−100, +70) for Relay 01, (+100, +70) for Relay 02 (mirror); trunk out bottom (60, +98) / (−60, +98) |
| **Classroom light** | 400 × 130 | **LED batten** fixture: long body, end caps, mounting brackets, diffuser strip; ON state = 5–7 hard-edged **yellow ray polygons** below, OFF = paper fill + hatch | `light__body`, `__diffuser`, `__rays`, `__brackets` | Top connector (0, −65) |
| **Split AC (indoor unit)** | 400 × 180 | Wide white body (paper-lite), **louvre flap** (rotatable), vent slats, small display window with LED, brand-free; ON = 3 wavy cool-air streaks + fan icon, OFF = flap closed | `ac__body`, `__flap`, `__vents`, `__led`, `__streaks` | Top connector (0, −90) |
| **Phone camera (on tripod)** | 150 × 300 + tripod | Generic smartphone (rounded rect, notch-less), rear lens cluster shown as 2 lenses, small tripod legs, `LIVE PROTOTYPE INPUT` chip | `cam__phone`, `__lens`, `__tripod` | RTSP out (75, −40) |
| **Camera frame** | 520 × 340 | Ink-bordered viewport, mini classroom silhouette (board line + 2 desks), `REC ●` tag, corner ticks | `frame__window`, `__scene`, `__rec` | Local origin = center; person spawns at (−320, +70) |
| **Person silhouette** | 70 × 180 | Faceless ink silhouette, 2 walk poses (`steps(2)`) | `person__a`, `__b` | Box tight rect (±42, ±100) |
| **Monitor** | Body 1200 × 720 (+ stand, keyboard silhouette to y ≈ 2400) | Thick ink bezel, paper face, screen 1080 × 608 (`#111` fill, paper keyline), **port notches** on top, left and right edges, chunky stand, tiny power LED | `mon__body`, `__screen`, `__ports`, `__stand`, `__keyboard`, `__crack` | Ports: top y = 1560: x = 950, 1200, 1350, 1500, 1600; left (600, 1700); right (1800, 1700) |
| **Classroom** | 1500 × 820 | See Scene 01 | `room__wall`, `__board`, `__light`, `__door`, `__desks`, `__clock`, `__annotations` | — |

### 11.4 If (and only if) SVG art proves impractical — raster fallback spec
Only for the *hardware* objects in 11.3, never wires/labels/packets. One object per file, **transparent PNG or WebP, 2 × resolution** (e.g., ESP32 480 × 880), no baked text, no baked shadow, no background, consistent 8-unit ink outline at 1 × scale, same palette as §9, same light direction (top-left), object centered with 40 px transparent padding, ≤ 60 KB each, lazy-loaded (`loading="lazy"`, `decoding="async"`). Anchor points in §11.3 must be provided as a JSON side-file. **Do not generate a combined scene image.** If used, sub-part animation (LEDs, levers, flap) must be re-added as separate SVG overlays.

---

## 12. SVG WIRE ARCHITECTURE

### 12.1 Construction of every wire
Each wire is **one `WirePath`** with these layers (bottom → top):
1. **Halo:** paper-colored stroke, width outer + 8. This makes crossing wires "bridge" automatically. Rendered under each wire, above earlier wires.
2. **Outer stroke:** ink. `sig` = 14, `vcc`/`gnd` = 8, relay signal = 14, load-side wire = 16, data-line trace = 12.
3. **Core stroke:** `sig` core width 6 (PIR = yellow `#FFD83D`, DHT = cyan `#27C7E8`, relay signal = yellow, load-side = yellow); `vcc`/`gnd` have no core (solid ink).
4. **Plugs:** Dupont-style connector ends — ink rect 26 × 16, radius 2, two paper pin holes — drawn at both endpoints. The sensor-side plug is present from the start (it is part of the sensor); the ESP32-side plug pops in (scale 0 → 1.15 → 1) during the last 0.3 of the wire's window.

**Draw mechanism (mandatory):** set `pathLength="1"` on every stroke path, `stroke-dasharray: 1`, `stroke-dashoffset = 1 − t`, with `t = seg(p, a, b, linear)`. Use `stroke-linecap: butt` on the outer stroke (round caps leave a dot at `t = 0`) and set `visibility:hidden` when `t < 0.001`. **Never animate opacity to reveal a wire.**
For packets, `pathLength` does not change `getPointAtLength`, which works in real user units. Cache `L = path.getTotalLength()` once after mount (the SVG uses a fixed viewBox, so `L` is stable across resizes).

### 12.2 Anchor table and paths — landscape (world units)

| Object | Center | Key anchors |
|---|---|---|
| ESP32 | (1200, 600) | body x 1080 – 1320, y 380 – 820; left pads x = 1092 (3V3 y 450, GPIO27 y 560, GND y 720, GPIO25 y 780); right pads x = 1308 (same y's; GPIO4 y 560, GPIO26 y 780) |
| PIR | (700, 600) | body x 590 – 810; pins x = 818 (VCC y 610, OUT y 640, GND y 670); bottom out (700, 735) |
| DHT11 | (1700, 600) | body x 1610 – 1790; pins x = 1602 (VCC y 570, DATA y 600, GND y 630); bottom outs (1740, 702) and (1780, 702) |
| Relay 01 | (700, 1060) | body x 570 – 830, y 965 – 1155; IN (700, 965); load out (600, 1130); trunk out (760, 1158) |
| Relay 02 | (1700, 1060) | body x 1570 – 1830; IN (1700, 965); load out (1800, 1130); trunk out (1640, 1158) |
| Light | (400, 1360) | 400 × 130; top connector (400, 1295) |
| AC | (2000, 1380) | 400 × 180; top connector (2000, 1290) |
| Phone camera | (2440, 760) | RTSP out (2515, 700) |
| Camera frame | (2900, 620) | left edge x = 2640 (RTSP in (2640, 700)) |
| Pipeline chips | y = 960, centers x = 2660 / 2820 / 2980 / 3140 (140 × 44 each) | FastAPI chip bottom (3140, 982) |
| Monitor | body x 600 – 1800, y 1560 – 2280 | ports listed in §11.3 |

**Sensor wires** (`paths.ts`, landscape):
```
pir.sig : M818 640 H900 C960 640 980 560 1040 560 H1092
pir.vcc : M818 610 H880 C930 610 960 450 1030 450 H1092
pir.gnd : M818 670 H880 C930 670 960 720 1030 720 H1092
dht.sig : M1602 600 H1500 C1440 600 1420 560 1360 560 H1308
dht.vcc : M1602 570 H1520 C1470 570 1440 450 1370 450 H1308
dht.gnd : M1602 630 H1520 C1470 630 1440 720 1370 720 H1308
```
**Relay signal wires** (orthogonal, corner radius 40):
```
relay1.sig : M1092 780 H1040 Q1000 780 1000 820 V860 Q1000 900 960 900 H740 Q700 900 700 940 V965
relay2.sig : M1308 780 H1360 Q1400 780 1400 820 V860 Q1400 900 1440 900 H1660 Q1700 900 1700 940 V965
```
**Load-side wires**:
```
relay1.out : M600 1130 V1190 Q600 1220 570 1220 H430 Q400 1220 400 1250 V1295
relay2.out : M1800 1130 V1190 Q1800 1220 1830 1220 H1970 Q2000 1220 2000 1250 V1290
```
**RTSP wire:** `M2515 700 H2640` (ink 10, yellow core 4, label `RTSP` above it).

### 12.3 Data-explosion lines (Scene 10) — 7 trunk lines
Rendered as **PCB traces**: halo + ink 12 + cyan dashed inner stroke (width 4, `stroke-dasharray: 18 22`, `stroke-dashoffset = −p·60`), corner radius 30. Lines are drawn **under** hardware (z-order in §4.5) so they appear to emerge from behind each object. All coordinates are starting values; verify visually (§23).
```
line.esp32     : M1200 832 V1560                                                          → port (1200, 1560)
line.pir       : M700 735 V780 Q700 810 670 810 H100 Q70 810 70 840 V1670 Q70 1700 100 1700 H600      → left port (600, 1700)
line.relay1    : M760 1158 V1440 Q760 1470 790 1470 H920 Q950 1470 950 1500 V1560         → port (950, 1560)
line.relay2    : M1640 1158 V1420 Q1640 1450 1610 1450 H1380 Q1350 1450 1350 1480 V1560   → port (1350, 1560)
line.dhtTemp   : M1740 702 V740 Q1740 770 1770 770 H2250 Q2280 770 2280 800 V1470 Q2280 1500 2250 1500 H1530 Q1500 1500 1500 1530 V1560   → port (1500, 1560)
line.dhtHum    : M1780 702 V800 Q1780 830 1810 830 H2280 Q2310 830 2310 860 V1500 Q2310 1530 2280 1530 H1630 Q1600 1530 1600 1560         → port (1600, 1560)
line.yolo      : M3140 990 V1670 Q3140 1700 3110 1700 H1800                               → right port (1800, 1700)
```
Rules: ≤ 2 planned crossings (both on the two DHT lines; the halo makes them read as bridges); no line passes over a hardware body; lines are **grouped visually** by arriving at ports in this left → right order on the top edge: relay1, esp32, relay2, temp, hum; pir enters the left edge, yolo the right edge. Each port is a notch (28 × 16) that fills yellow when its packet arrives.
**Do not add more lines.** Seven meaningful paths is the budget.

### 12.4 Portrait geometry
Same story, shorter paths. Use the helper `orthoPath(points, r = 30)` in `paths.ts` (builds `d` from a waypoint array with rounded corners) rather than hand-writing `d`. Portrait anchors and waypoints are in §14.3.

---

## 13. DATA PACKET ARCHITECTURE

**One reusable `DataPacket` primitive**, not one component per label.

- **Shape:** rectangle, sharp corners, **3 px ink border, 4 px hard offset shadow**, IBM Plex Mono 700 14 px, padding 10 × 8 px. Size is defined in **screen pixels** (the packet is counter-scaled by `1/z`), text width measured once (`getComputedTextLength`, fallback `chars × 8.6`).
- **Fill by meaning:** sensor telemetry `#27C7E8` (cyan, ink text); commands `CMD: OFF` `#FFD83D` (yellow, ink text); API endpoint tag `POST /api/sensor-data` `#356AE6` (paper text); occupancy/vision results `#35C759` (green, ink text) only for `1 PERSON`/`OCCUPIED` plates, otherwise cyan.
- **Motion:** position = `path.getPointAtLength(u · L)`, `u = seg(p, a, b, inOutSine)`. Rotation always 0° (labels stay readable). Scale: 0 → 1 over the first 8 % of `u`, 1 → 0 over the last 10 % ("absorbed"). At absorption the destination fires its reaction (LED toggle, port fills yellow, pulse ring).
- **Anchoring:** the packet's **left-center** rides the path point, offset (+10, −26) px so it floats just above the wire and never hides the wire.
- **Reverse:** `u` is a function of `p`, so scrolling up moves packets backward and un-absorbs them.
- **Performance:** ≤ 7 packets alive at once; at most 7 `getPointAtLength` calls per frame; culled outside their window.
- **Values are visual samples.** Every packet scene shows the `SAMPLE VALUES` chip. **Nothing is fetched.**

| Packet | Text | Path | Window | Fill | Scene |
|---|---|---|---|---|---|
| Motion | `MOTION: 1` | `pir.sig` (PIR → ESP32) | 41 – 43.6 | cyan | 06 |
| Temp | `TEMP: 28.4°C` | `dht.sig` (DHT → ESP32) | 41.8 – 44.4 | cyan | 06 |
| Humidity | `HUMIDITY: 61%` | `dht.sig` | 42.6 – 45.2 | cyan | 06 |
| Motion 0 | `MOTION: 0` | `pir.sig` | 55 – 56.4 | cyan | 08 |
| Cmd 1 | `CMD: OFF` | `relay1.sig` (ESP32 → Relay 01, reverse direction) | 57.4 – 58.5 | yellow | 08 |
| Cmd 2 | `CMD: OFF` | `relay2.sig` (ESP32 → Relay 02) | 57.5 – 58.6 | yellow | 08 |
| Endpoint | `POST /api/sensor-data` | `line.esp32` | 76 – 78 | blue | 10 |
| Occupancy | `OCCUPANCY: 1` | `line.pir` | 76.4 – 79 | cyan | 10 |
| Temp | `TEMP: 28.4` | `line.dhtTemp` | 76.8 – 79.4 | cyan | 10 |
| Humidity | `HUMIDITY: 61` | `line.dhtHum` | 77.2 – 79.8 | cyan | 10 |
| Light | `LIGHT: ON` | `line.relay1` | 77.6 – 80 | cyan | 10 |
| AC | `AC: OFF` | `line.relay2` | 78 – 80.3 | cyan | 10 |
| Yolo | `YOLO: 1 PERSON` | `line.yolo` | 78.4 – 80.6 | cyan | 10 |

`POST /api/sensor-data` is the real ingest endpoint in `docs/SPEC.md` and `services/api/app/routers/ingest.py` — the only endpoint name the landing page may print.

---

## 14. RESPONSIVE BEHAVIOR

### 14.1 Layout selection
`useLayout()` chooses **`LANDSCAPE`** or **`PORTRAIT`** via `matchMedia('(max-aspect-ratio: 1/1), (max-width: 720px)')` and re-evaluates on `resize` and `orientationchange`. Phones (portrait), small windows, and tablets in portrait use **PORTRAIT**. Laptops, desktops, and tablets in landscape use **LANDSCAPE**. The timeline (`W`, `CH`) is **identical**; only anchors, camera keyframes, path strings, sizes and label sets change (`layout.ts`, `paths.ts`).

- Landscape viewBox `0 0 1600 900`; portrait `0 0 900 1600`; `preserveAspectRatio="xMidYMid meet"`. Backgrounds are full-bleed HTML, so letterboxing is invisible.
- Track height: landscape 1500 vh; portrait 1250 dvh. Use `dvh`/`svh` and `visualViewport` resize so the iOS URL bar doesn't cause jumps.
- **Never** scale the desktop composition down. On portrait every object has its own anchor.
- Minimum on-screen sizes: labels ≥ 12 px, packets ≥ 12 px text, hardware ≥ 90 px wide on a 390 px phone, touch targets ≥ 44 px (CTA ≥ 64 px).

### 14.2 Simplifications on portrait
- Callouts: ESP32 keeps only `MCU` and `GPIO` (+ `EDGE CONTROL` bracket label); PIR/DHT/relay labels stay (short forms: `MOTION · PIR`, `ENVIRONMENT · DHT11`, `RELAY 01 · LIGHTS`, `RELAY 02 · AC`).
- Footnote `SIGNAL WIRES ONLY…` hidden; the honesty strip wraps to 2 lines at 10 px.
- Scene 08: the `MOTION: 0` packet is replaced by a static `MOTION: 0` badge on the SENSE chip; `CMD: OFF` packets still travel.
- Scene 10: **5 trunks** instead of 7 (`dhtTemp`+`dhtHum` share one trunk and their packets run sequentially; `pir` trunk dropped — `OCCUPANCY: 1` rides the ESP32 trunk).
- Sensor wires: keep all 3 per sensor; each ≤ 300 units.
- Terminal: 16 px min; 7 check lines stack in a single column.
- Title overlays top-center; `SMART / CLASSROOM` sized `clamp(44px, 14vw, 88px)`; CTA full-width minus 32 px, max 420 px.
- `SceneProgress` moves to the bottom edge, ticks only (no labels).

### 14.3 Portrait anchors (world 900 × 4400) and camera

| Object | Center / anchors | Notes |
|---|---|---|
| Classroom | (450, 780), scale .58 | ghost after 14 |
| ESP32 | (450, 900), **rotated +90°** (USB left, antenna right); visual 440 × 240 | left header → top edge, right header → bottom edge |
| PIR | (450, 470), scale .9, enters from x = −250 | pins (bottom) VCC (530, 600), OUT (490, 600), GND (450, 600) |
| DHT11 | (450, 1330), scale .9, enters from x = 1150 | pins (top) VCC (560, 1240), DATA (490, 1240), GND (420, 1240) |
| ESP32 pads (top edge, y = 792) | 3V3 x = 600, GPIO27 x = 490, GND x = 330 | PIR wires end here |
| ESP32 pads (bottom edge, y = 1008) | 3V3 x = 600, GPIO4 x = 490, GND x = 330; relay pads x = 280 (R2) and x = 240 (R1) | DHT wires + relay wires start here |
| Relay 01 / 02 | (240, 1900) / (660, 1900), scale .85; tops at y = 1819 | enter from left / right |
| Light / AC | (240, 2380) / (660, 2380), scale .7 | loads |
| Phone / frame | (140, 3000) scale .75 / (590, 2980) scale .8 | RTSP wire (196, 2990) → (382, 2990) |
| Chips row | y = 3240, centers x = 145 / 335 / 525 / 715 (170 × 44) | FastAPI bottom (715, 3275) |
| Monitor | body 840 × 504 at x 30 – 870, y 3748 – 4252 (scale .7), screen center ≈ (450, 3990) | ports top y = 3748 |

Portrait wires:
```
pir.sig : M490 600 V792
pir.vcc : M530 600 C530 700 600 700 600 792
pir.gnd : M450 600 C450 700 330 700 330 792
dht.sig : M490 1240 V1008
dht.vcc : M560 1240 C560 1120 600 1130 600 1008
dht.gnd : M420 1240 C420 1120 330 1130 330 1008
relay1.sig : M240 1008 V1819
relay2.sig : M280 1008 V1140 Q280 1170 310 1170 H660 Q690 1170 690 1200 V1819
relay1.out : M240 1985 V2330        relay2.out : M660 1985 V2325
```
Portrait data lines (`orthoPath`, r = 30, **zero crossings**; the outermost channel takes the lowest lane and the rightmost port):
```
esp32   : (670,900) (880,900) (880,3720) (720,3720) (720,3748)
dht     : (540,1330) (860,1330) (860,3690) (630,3690) (630,3748)      // carries TEMP then HUMIDITY
relay2  : (770,1930) (840,1930) (840,3660) (540,3660) (540,3748)
yolo    : (715,3275) (715,3300) (820,3300) (820,3630) (450,3630) (450,3748)
relay1  : (130,1930) (30,1930) (30,3690) (270,3690) (270,3748)
```
Portrait camera `(cx, cy, z)` by progress (cx is always 450): 0 → (800, 1.00) · 8 → (820, 1.05) · 14 → (900, 1.05) · 20 → (900, 1.12) · 27 → (900, 1.00) · 45 → (900, 1.00) · 52 → (2050, 0.95) · 60 → (2050, 0.95) · 63 → (3000, 1.00) · 70 → (3000, 1.04) · 73 → (2200, 0.36) · 82 → (2200, 0.36) · 85.5 → (3990, 1.00) · 87.4 → (3990, 1.06) · 90 → (3990, 1.06) · 92 → (3990, 2.40).

---

## 15. ACCESSIBILITY

**Reduced motion (`prefers-reduced-motion: reduce`)** — checked at mount and on change (`matchMedia` listener):
- `IntroRoot` renders `StaticStoryboard` instead of the sticky-track engine. **No scroll choreography, no rAF loop, no damping, no shake, no glitch, no pulse, no cursor blink, no CSS loops.**
- It is a normal-flow page of **10 sections**, each `<IntroWorld frozenP={N} />` (same components, same art) with an `<h2>` and a one-sentence caption: 1 Empty classroom `p = 6` · 2 ESP32 `p = 19` · 3 Sensors `p = 33` · 4 Wires `p = 40.5` · 5 Data packets `p = 44` · 6 Relays and loads `p = 54` · 7 Energy control `p = 60` · 8 Vision layer `p = 69.5` · 9 Data to the computer `p = 81` · 10 Computer, then a static **red 404 panel** and the static terminal list with all checks shown.
- Hardware appears sequentially down the page; all text retained; the CTA `INITIALIZE DASHBOARD →` is at the bottom; **the click still navigates to `/`** (curtain skipped, plain `navigate('/')`).
- `SKIP INTRO →` remains at the top.

**Always (even with animation):**
- `SKIP INTRO →` is the **first focusable element**; it links to `/`. Ink-bordered rectangle, visible focus ring (3 px ink outline, 3 px offset).
- One `<h1>` (`Smart Classroom`). Chapter titles are real headings inside `aria-hidden`-free overlay layers; the SVG world is `aria-hidden="true"` (decorative). A **visually-hidden `<ol>`** narrates the story in 14 steps for screen readers (text only, not tied to scroll).
- The CTA is a real `<button type="button">`. It is `visibility:hidden` + `aria-hidden` + `tabindex=-1` until `p ≥ 98.8`, then focusable. Enter/Space work. It never traps focus.
- Keyboard scroll (Space, PgUp/PgDn, arrows, Home/End) works natively because we never intercept scroll.
- `SceneProgress` ticks are buttons with `aria-label="Jump to <scene name>"`; they smooth-scroll to the chapter start (instant if reduced motion).
- State is never conveyed by color alone (every state has a text label).
- Contrast: see §9. On red, text ≥ 24 px bold or on plates.
- **Flash safety for the 404:** the red cut happens **once**; no full-screen alternation; glitch state is quantized to `floor(p·8)` and the displayed progress is slew-limited to 5 %/s inside 87 – 90.5, so nothing can strobe faster than ~3 Hz even under aggressive scrolling.
- No audio. No autoplay media. No time limit.
- Page title stays `Smart Classroom — Occupancy & Resource Management System` (do not change `document.title`).

## 16. PERFORMANCE STRATEGY

**Budgets (verify in §23):** ≥ 55 fps while scrubbing on a mid-tier college laptop (integrated GPU); ≥ 30 fps at 4× CPU throttle; ≤ 6 ms scripting per frame; ≤ 3 000 SVG nodes in `.lp-world` (`document.querySelectorAll('.lp-world *').length`); intro chunk ≤ 120 KB gzipped excluding fonts; **dashboard bundle size unchanged** (the intro is a lazy chunk).

**Do**
- Animate only `transform`, `opacity`, `stroke-dashoffset`, `clip-path`, `visibility`. Move objects with `translate/rotate/scale` on their `<g>` (SVG `transform` attribute or style).
- Direct DOM writes in track functions; **no React state per frame**. Batch all writes inside the single rAF callback (read → compute → write; no layout reads inside the write phase).
- Cache `getTotalLength()`; ≤ 7 `getPointAtLength` calls per frame.
- **Cull** scene groups outside `[start − 1.5, end + 1.5]` with `visibility:hidden`.
- Stop rAF when settled (§4.2). No idle loops.
- Textures: grain = one 256 px tile as a CSS `background-image` data URI on a fixed layer (rasterized once); grid = CSS gradient; halftone = one shared SVG `<pattern>`.
- One `will-change: transform` on the camera `<g>` only. No `will-change` elsewhere.
- Lazy chunk via router `lazy`; fonts: Archivo `latin-800/900` only.
- Pause: stop the rAF loop and remove listeners on `visibilitychange: hidden` and on unmount (StrictMode double-mount safe: effect cleanup must cancel everything).

**Don't**
- No videos, no big PNG backgrounds, no `filter` (blur, drop-shadow), no `backdrop-filter`, no `mix-blend-mode`, no `box-shadow` animation, no canvas, no Three.js, no thousands of particles, no per-frame `top/left/width/height`, no `getBoundingClientRect` in the frame loop.
- Never re-render scene components per frame.

**Fallback if SVG paint cost is too high at zoom:** first, tighten culling; second, lower stroke complexity (drop halftone pattern below z .6); third, promote hardware to per-object HTML layers (`will-change: transform`) with wires staying SVG. Do this only after profiling.

## 17. ROUTING / DASHBOARD TRANSITION

### 17.1 Route (Option A — implement now)
In `src/app/router.tsx`, add **one** sibling route next to `/watchman`, outside `AppShell`:
```tsx
{
  path: '/intro',
  lazy: async () => {
    const { IntroPage } = await import('../pages/IntroPage');
    return { Component: IntroPage };
  },
},
```
`/` remains `AppShell → DashboardPage`. Direct visit to `http://localhost:5173/intro` shows the story. `IntroPage` has no `AppShell`, no `NavRail`, no React Query hooks.

### 17.2 CTA behavior
`ReadyScene` calls `useNavigate()`. On click:
1. Ignore further clicks; add `html.lp-leaving` (`overflow: hidden`, `pointer-events: none` on the page).
2. If reduced motion: `navigate('/')` immediately. Done.
3. Otherwise `startDashboardTransition({ from: buttonRect, onCovered: () => navigate('/') })` from `transition/dashboardTransition.ts`.

### 17.3 The transition (time-based, ≈ 1 100 ms; the only non-scrub animation)
`dashboardTransition.ts` is **imperative and lives outside React** so it survives the route change:

| t (ms) | What happens |
|---|---|
| 0 – 120 | Button **presses**: `translate(8px, 8px)`, shadow → 0 (CSS transition, no scale). Title/CTA text stays. |
| 120 – 520 | A fixed, full-viewport **curtain** `<div>` (paper `#F4F1EA` fill, 4 px ink border drawn as the monitor bezel) is appended to `document.body`, `z-index: 2147483000`. It starts as a small monitor-shaped window centered on the button (`clip-path: inset(...)` ≈ button rect) and expands to **`inset(38% 30% 38% 30%)`** (a monitor-screen-sized window). Landing type fades to 0. |
| 520 – 900 | `clip-path` animates to `inset(0)` (window fills the viewport). Only `clip-path` animates. |
| ≈ 760 | When the window covers > 90 % of the viewport, call `navigate('/')`. The router swaps `IntroPage` → `AppShell/DashboardPage` **beneath the curtain** (SPA navigation, no reload). |
| 900 – 1 100 | After **two `requestAnimationFrame`s** post-navigation (dashboard painted), the curtain's opacity fades 1 → 0 (200 ms) and the node is removed. The curtain's final fill is the dashboard paper `#F4F1EA`, so the dashboard "emerges" from the screen with no color jump. |

- Durations: press 120, expand 400 + 380, fade 200. Easing: `cubic-bezier(.7, 0, .2, 1)` for expansion.
- If the route fails to mount within 2 s, remove the curtain anyway (safety timer).
- On mount, `IntroRoot` adds `html.lp-active` (sets overscroll/background to paper); on unmount it **removes** it and any `lp-leaving` class. Nothing persists into the dashboard.
- **Browser Back** from the dashboard returns to `/intro` with the previous scroll position restored; the engine snaps to that progress on the first frame (§4.2).
- The dashboard is **not** duplicated, embedded, or restyled. The transition curtain is the only "dashboard-like" visual.
- **Optional Phase 2 (only after acceptance, needs your approval):** make the intro the default entry by moving the dashboard to `/dashboard`. That requires editing exactly three existing files: `router.tsx` (index route → `path: 'dashboard'`; new `/` → intro), `NavRail.tsx` (`{ path: '/', … }` → `'/dashboard'`, and the two `end={item.path === '/'}` props), and `NotFoundPage.tsx` (`to="/"` → `to="/dashboard"`); the CTA target becomes `/dashboard`. Do **not** do this in Phase 1.

---

## 18. FILES TO CREATE

All under `apps/web/src/` (see §5 for responsibilities):
```
pages/IntroPage.tsx
components/intro/IntroRoot.tsx
components/intro/intro.css
components/intro/engine/{StageProvider.tsx, useTrack.ts, timeline.ts, easing.ts, layout.ts, paths.ts, types.ts}
components/intro/world/IntroWorld.tsx
components/intro/world/scenes/{IntroScene, Esp32Scene, SensorScene, SensorWireSystem, DataFlowScene, RelayScene, EnergyScene, VisionScene, DataExplosionScene, ComputerScene, Error404Scene}.tsx
components/intro/world/hardware/{Esp32Board, PirSensor, Dht11Sensor, RelayModule, CeilingLight, SplitAc, PhoneCamera, Monitor, ClassroomIllustration}.tsx
components/intro/primitives/{WirePath, DataPacket, TechnicalLabel, TelemetryBadge, HardShadow, PulseRing, Stamp}.tsx
components/intro/overlays/{Backgrounds, TitleOverlay, HudStrip, SceneProgress, BootScene, ReadyScene, BrutalistButton, SkipIntro, DebugOverlay}.tsx
components/intro/static/StaticStoryboard.tsx
components/intro/transition/dashboardTransition.ts
```
Keep component files exporting **only components** (oxlint `only-export-components`). Put constants/helpers in `.ts` files.

## 19. FILES TO MODIFY

**Exactly one:** `apps/web/src/app/router.tsx` — add the `/intro` lazy route (§17.1). No other existing file changes in Phase 1.

## 20. FILES THAT MUST NOT BE MODIFIED

`src/App.tsx`, `src/main.tsx`, `src/index.css`, `index.html`, `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig*.json`, `.oxlintrc.json`, `src/components/layout/AppShell.tsx`, `src/components/layout/NavRail.tsx`, everything in `src/pages/` **except** the new `IntroPage.tsx` (Dashboard, Classrooms, ClassroomDetail, Camera, Timetable, Energy, Analytics, Predictions, Alerts, Reports, Settings, Watchman, NotFound), everything in `src/components/features/`, `src/services/` (including `api.ts`, `mocks/`), `src/types/`, `src/lib/styles.ts`, and **everything outside `apps/web`** (`services/api`, `services/vision`, `services/sensor-sim`, `scripts/`, `docs/`, `cameras.yaml`, `.env*`, database, migrations).

Also: **do not** import from or call any existing page, `api`, `react-query`, or `NotFoundPage` inside the intro; **do not** edit global CSS variables or `@theme`; **do not** change `document.title`, `<html>` attributes (beyond the temporary `lp-active`/`lp-leaving` classes) or the meta tags.

## 21. DEPENDENCIES TO ADD

**None.** (`@fontsource/archivo` weights 800/900 are already inside the installed package: no `package.json` change.) If — and only if — the escape hatch in §4.1 is triggered, the only permitted addition is `gsap` (core + ScrollTrigger) used solely as a progress source, and it needs your approval first.

---

## 22. IMPLEMENTATION ORDER FOR ANTIGRAVITY

Each phase ends with `npm run lint` and `npm run build` in `apps/web` passing, and a manual check. Do not start a phase until the previous one passes. **Commit after each phase.**

1. **Repo check (read-only).** Confirm the facts in §1–3 (router, deps). Confirm `npm run build` passes *before* any change.
2. **Skeleton + route.** Create `IntroPage`, `IntroRoot`, empty `intro.css` with tokens, add the lazy `/intro` route. Verify: `/intro` loads, `/` and all other routes are unchanged, dashboard bundle unchanged.
3. **Engine.** `timeline.ts`, `easing.ts`, `StageProvider`, `useTrack`, rAF/damping/slew, layout hook, tall track + sticky stage, `DebugOverlay` (`?debug=1`, `?p=NN` freeze, FPS, scrub slider). Verify with a dummy square driven by `seg()`: moves down and back up exactly.
4. **Backgrounds + HUD + progress ticks + Skip link.** Paper/grid/grain/reg marks, HUD state machine, honesty strip.
5. **Scene 01.** Classroom art, title overlay, hint, annotations, camera drift.
6. **Scene 02.** `Esp32Board` art, rise/settle/activation, `THE BRAIN`, callouts, camera push.
7. **Scenes 03–04.** `PirSensor`, `Dht11Sensor`, overshoot/settle, labels, motion ticks.
8. **Scene 05.** `WirePath` primitive (halo/outer/core/plugs/draw), 6 sensor wires, pulses, stamp.
9. **Scene 06.** `DataPacket` primitive + 3 packets on real paths, TX LED.
10. **Scene 07.** `RelayModule` ×2, relay wires, `CeilingLight`, `SplitAc`, load wires, levers, ON states, camera pan. Footnote.
11. **Scene 08.** Stamps, SENSE/DECIDE/ACT, `MOTION: 0`, `CMD: OFF` packets, lever flip, loads OFF.
12. **Scene 09.** `PhoneCamera`, frame, person, YOLO box, pipeline chips, privacy stamp, light-back-ON beat.
13. **Scene 10.** `Monitor` rise, 7 data lines, ports, 7 packets, flow dashes. Verify against §12.3 crossings.
14. **Scene 11–12.** Screen content, check lines, crack, red cut, 404, glitch (deterministic + slew limit), `SYSTEM REBOOT` bar.
15. **Scene 13.** `bg-dark` cut, push-in, `BootScene` terminal, typed line, ✓ checks, `SYSTEM READY`, paper return.
16. **Scene 14.** Ready titles, sub-line, `BrutalistButton`, enable logic.
17. **Scene 15.** `dashboardTransition.ts`, CTA wiring, `lp-leaving` handling, Back-button restore.
18. **Portrait layout.** `PORTRAIT` anchors, camera, wires, 5 data lines, label simplifications, shorter track.
19. **Reduced motion.** `StaticStoryboard` (frozen snapshots) + CTA + skip link.
20. **Polish + a11y + perf pass.** §15 checklist, §16 budgets, node count, 4× throttle test, `StrictMode` double-mount check.
21. **Final regression.** Full §23 test plan and §24 acceptance list.

**Rules while building:** hard-code no progress numbers in scene files (import from `timeline.ts`); never add a timer for story animation; if a coordinate needs > 40 units of adjustment, stop and record it in `docs/DECISIONS.md` as a note **proposed** (do not edit that file without approval); no `any`; no `Math.random()`.

## 23. TESTING PLAN

No test runner is installed and none should be added. Testing is by build checks, deterministic screenshots, and a manual matrix.

**Automated (existing scripts):** `npm run lint` (oxlint) and `npm run build` (`tsc -b && vite build`) must pass. After build, confirm the intro is a **separate chunk** and that the main entry chunk size did not grow.

**Debug tooling (dev only; `import.meta.env.DEV` or `?debug=1`):**
- `?p=NN` freezes the story at progress `NN` (uses `renderAt`) so any frame is screenshot-reproducible.
- Overlay: current `p`, chapter name, FPS, node count, camera `(cx, cy, z)`, scrub slider (drives `scrollTo`), toggles for wire path guides / anchor points / safe area.

**Reference frames (screenshot at each `p`, both layouts):** 0, 4, 7.5, 10, 14, 16.5, 19, 22, 26, 30, 33, 36, 38, 40.5, 43, 45.2, 47, 50, 53, 54.5, 57, 59, 62, 65, 67, 68.5, 70, 72, 76, 80, 84, 86.5, 87.8, 88.5, 89.5, 90.2, 91.5, 93, 95, 96.3, 97, 99.

**Manual checks**
1. **Reversibility:** scroll to 60, then back to 0 (slowly and fast). At each reference `p` the frame must match the same frame reached scrolling down. Wires retract, packets move backward, 404 returns to the check list.
2. **Determinism:** load `/intro?p=88.5` twice: identical glitch frame.
3. **Route regression:** every route in §2 loads; NavRail highlights `Dashboard` at `/`; `/watchman` unchanged; unknown URL still renders `NotFoundPage` (not the theatrical 404).
4. **CTA:** click → curtain → lands on `/` (real `DashboardPage`), no reload (verify by a JS variable surviving), no duplicated dashboard, curtain gone, `html` classes cleaned up. Browser Back returns to `/intro` at the previous progress.
5. **Backend down:** stop the API; `/intro` still fully works, zero network errors, zero console errors.
6. **StrictMode:** dev mode double-mount leaves exactly one rAF loop and one scroll listener.
7. **Reduced motion:** toggle the OS setting / DevTools rendering emulation; static storyboard shown; CTA works; no rAF running.
8. **Devices:** 1366 × 768, 1440 × 900, 1920 × 1080, 2560 × 1440 (landscape); 768 × 1024 (portrait tablet); 390 × 844 (phone, iOS Safari + Android Chrome, URL-bar collapse); phone rotated to landscape.
9. **Performance:** Chrome Performance recording while scrubbing 0 → 100 (desktop, and 4× CPU throttle): frames ≤ 16.7 ms mostly, no long tasks, no layout thrash; SVG node count ≤ 3 000.
10. **Honesty audit (read every string):** no claim that ESP32/PIR/DHT11 are physically connected; `SAMPLE VALUES`, `TARGET HARDWARE`, `LIVE PROTOTYPE INPUT`, `DEMO SEQUENCE · NOT LIVE STATUS` visible where specified; no face/name/ID anywhere; no fetched or "live" numbers.
11. **Keyboard:** Tab order = Skip → progress ticks → (CTA only when enabled); Space/PgDn scroll; Enter on CTA navigates.
12. **Console:** zero errors/warnings on a full scroll-through in both layouts.

## 24. ACCEPTANCE CRITERIA

The work is accepted only if **all** of these hold. (Items 1–30 are the brief's list; A–H are additions from this blueprint.)

1. Initial page is an empty classroom (no people, no hardware).
2. ESP32 enters through scrolling (from below, 7 → 13.5).
3. ESP32 is the visual hero of its section (centered, activation plate, callouts, camera push).
4. PIR enters from the left.
5. DHT11 enters from the right.
6. Both connect physically to the ESP32 (plugs at the ESP32 pads).
7. Wires visibly draw themselves (dashoffset, not fade).
8. Sensor data packets travel along the real wire paths.
9. Relay modules arrive after the sensors.
10. Relays connect (wires draw) to the light and the AC.
11. Energy-saving behavior is visually demonstrated (idle → decision → action; light and AC go OFF).
12. Camera / YOLO11n layer appears afterwards.
13. Person detection is visually represented (silhouette, box, `PERSON`, `CONFIDENCE 0.94`, `1 PERSON`, `OCCUPIED`).
14. Data lines emerge from the assembled system.
15. Data lines converge on the computer's ports.
16. Computer shows `CONNECTING...` then the 5 check lines.
17. A short theatrical 404 occurs (≈ 2.6 % of scroll).
18. The 404 does not break the application (no throw, no route change, no `NotFoundPage`).
19. Reboot sequence follows (terminal, 7 ✓, `SYSTEM READY`).
20. `ARE YOU READY?` appears alone.
21. CTA is neo-brutalist (rectangular, 4 px ink border, hard shadow, translate-on-hover/press, no scale, no pill, no glass, no gradient).
22. CTA navigates to the **real existing dashboard** (`/`) via SPA navigation.
23. Existing dashboard and all other routes are unchanged (diff shows only the new files + one route entry).
24. Every scroll animation reverses correctly (§23 check 1).
25. Mobile (portrait layout) is usable and tells the full story in order.
26. Reduced-motion mode works (static storyboard + working CTA).
27. No giant flattened landing image; all hardware is separate SVG components.
28. No fake live data is presented as real (`SAMPLE`/`TARGET`/`DEMO` labels; §23 check 10).
29. No facial recognition, names, or IDs.
30. Existing functionality is not broken (lint + build pass; routes and dashboard regression pass).

**A.** Zero new dependencies (§21). **B.** Intro is a lazy chunk; dashboard bundle size unchanged. **C.** Performance budgets met (§16). **D.** No `filter`/blur/backdrop-filter/blend-mode in the intro CSS or SVG. **E.** No story animation uses `setTimeout`/`setInterval`/CSS keyframes (only the click transition, the scroll-hint bob and CTA hover/press). **F.** `SKIP INTRO →` present and working. **G.** No progress numbers hard-coded outside `timeline.ts`. **H.** `?p=NN` reproduces any frame identically.

---
*End of blueprint. Antigravity: do not add features, scenes or dependencies that are not listed here. If something is ambiguous, choose the option that changes fewer existing files and ask.*
