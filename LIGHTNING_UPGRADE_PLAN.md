# LANDING PAGE ENERGY UPGRADE — IMPLEMENTATION PLAN FOR ANTIGRAVITY

Project: `D:\Miniproject` · App: `apps/web` · React 19 + TS (strict: `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnusedLocals`) + Vite + Tailwind 4 + react-router-dom 7.

Goal: turn the existing landing page from "illustrated hardware + wires" into "anime engineering system powering up": fiery lightning replaces wires, energy visibly travels, dark contrast zones appear, camera scene goes dark, an electrical storm converges into the computer, 404 → reboot → "ARE YOU READY?" → lightning-blast entry into the real dashboard.

**This plan was written WITHOUT inspecting the landing-page source.** Every file/component name below is a role name. Step A resolves the role names to real files. Everything else (numbers, colors, timings, code) is final and must be used as written. Where the plan says "tune", the allowed tuning range is stated.

---

## 0. HARD RULES (violating any = fail)

1. Do NOT rebuild IntroPage. Do NOT create a second scroll engine. Do NOT redraw ESP32, PIR, DHT11, relays, light, AC, camera or computer illustrations.
2. Do NOT touch: dashboard pages, `AppShell`, `NavRail`, `router.tsx` (except nothing), `services/`, `types/`, backend, vision, sensor-sim, database, `index.css` global rules outside a `.landing-root` scope.
3. No new npm packages. No GSAP/Framer/Lenis/Three additions. SVG + CSS + TypeScript only.
4. No `setInterval`, no `setTimeout` choreography, no CSS `infinite` animations for anything in the energy system. Only two ambient exceptions: the REC dot blink and the terminal cursor blink (`steps(2)`, 1s).
5. All main-story motion is a pure function of global scroll progress `p ∈ [0,1]`. Same `p` → identical pixels, in either scroll direction. The only time-based sequence is the final dashboard blast (click-triggered, one-shot).
6. Never use `vector-effect: non-scaling-stroke` (breaks `pathLength` dashing). Stroke widths use the `--u` variable defined in §2.4.
7. Flashes are capped at 0.28 opacity (storm) and disabled entirely under `prefers-reduced-motion` (WCAG 2.3.1: never more than 3 flashes/second).
8. Keep demo labels honest: camera screen carries a `SAMPLE / DEMO` tag; sensor values remain labelled as demo values as they are today.
9. No facial recognition, no names, no identity labels.
10. Every edit to an existing file is minimal and listed in §9. Any file not in §8 or §9 is untouched.

---

## 1. STEP A — LOCATE (read-only; write the results into `LANDING_MAP.md` at repo root, then continue)

Run these from `apps/web/src`. Record file path + line for every hit. Do NOT modify anything in this step.

| Role name used in this plan | How to find it |
|---|---|
| `LANDING_DIR` | directory containing the intro/landing page component (`grep -rIl "IntroPage\|ARE YOU READY" .`) |
| `STAGE` | the pinned/sticky container that holds all scenes (`grep -rn "sticky\|position: *fixed\|h-screen" LANDING_DIR`) |
| `PROGRESS_SOURCE` | the single place where the global scroll progress number is computed (`grep -rn "scrollY\|scrollProgress\|progress" LANDING_DIR` → the function/hook that produces one 0–1 value or per-scene values) |
| `ESP32_SVG` | component/svg that draws the ESP32 (`grep -rIn "ESP32" LANDING_DIR`) |
| `BLACK_SHAPE` | the black element behind the ESP32 (procedure in §7.2) |
| `PIR`, `DHT11`, `RELAY1`, `RELAY2`, `LIGHT`, `AC`, `CAMERA`, `COMPUTER` | components for each object |
| `WIRES` | SVG `<path>` elements that draw sensor→ESP32, ESP32→relay, relay→load, and the data-explosion lines to the computer. For EACH wire record its `d` string and the `viewBox` of the SVG it lives in |
| `PACKETS` | data-packet label chips (MOTION: 1, TEMP…) and how they ride the wires |
| `SCENE_WINDOWS` | the start/end progress of every scene as implemented today |
| `NOT_FOUND_SCENE`, `BOOT_SCENE`, `READY_SCENE` | the 404, reboot and ready scenes |
| `CTA` | the "INITIALIZE DASHBOARD →" button and its click handler |
| `SCROLLBAR` | the progress indicator element and its CSS |
| `NAV_TARGET` | the exact route string/`navigate()` call the CTA uses today. Reuse it unchanged |
| `LANDING_CSS` | the landing-scoped stylesheet or class block |

If `PROGRESS_SOURCE` produces per-scene progress instead of one global number, write the adapter in §2.5 to convert to a global `p` using `SCENE_WINDOWS`.

**Timeline reconciliation:** §4 uses the blueprint's global windows (0.34–0.45 sensors, 0.45–0.60 relays, 0.60–0.70 camera, 0.70–0.82 explosion, 0.82–0.90 computer+404, 0.90–0.96 reboot, 0.96–1.00 ready). If `SCENE_WINDOWS` differ, DO NOT edit §4 numbers in many places: edit only `energyTimeline.ts` (§2.3) by remapping with `remap(x)` shown there.

---

## 2. NEW FOUNDATION FILES (create under `LANDING_DIR/energy/`)

### 2.1 `energyMath.ts`

```ts
export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
export const seg = (p: number, a: number, b: number): number => clamp01((p - a) / (b - a));
export const smooth = (t: number): number => t * t * (3 - 2 * t);
export const easeOut3 = (t: number): number => 1 - Math.pow(1 - t, 3);
export const easeIn2 = (t: number): number => Math.pow(t, 2.2);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** 0 → 1 → 0 bump between a and b */
export const pulse = (p: number, a: number, b: number): number => {
  const t = seg(p, a, b);
  return t <= 0 || t >= 1 ? 0 : Math.sin(Math.PI * t);
};
/** deterministic 0..1 hash: same (n, salt) → same value, so flicker is a pure function of scroll */
export const hash01 = (n: number, salt: number): number => {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(salt + 1, 0xc2b2ae35);
  x ^= x >>> 13;
  x = Math.imul(x, 0x27d4eb2f);
  x ^= x >>> 15;
  return (x >>> 0) / 4294967296;
};
export const quant = (p: number, steps: number): number => Math.floor(p * steps);
```

### 2.2 `energyProgress.ts` (the ONE integration point with the existing scroll engine)

```ts
type Listener = (p: number) => void;
const listeners = new Set<Listener>();
let current = 0;

export const energyProgress = {
  get: (): number => current,
  set(p: number): void {
    if (p === current) return;
    current = p;
    listeners.forEach((fn) => fn(p));
  },
  /** immediately calls fn with the current value, returns unsubscribe */
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    fn(current);
    return () => {
      listeners.delete(fn);
    };
  },
};
```

### 2.3 `energyTimeline.ts` (every window in the system lives here; nothing else contains a progress number)

```ts
import type { BoltWindow } from './energyTypes';

/** Only touch this if SCENE_WINDOWS differ from the blueprint. Blueprint anchors → real anchors. */
const ANCHORS: Array<[number, number]> = [
  // [blueprintP, realP]  — default identity
  [0, 0], [0.34, 0.34], [0.45, 0.45], [0.60, 0.60], [0.70, 0.70],
  [0.82, 0.82], [0.90, 0.90], [0.96, 0.96], [1, 1],
];
export const remap = (x: number): number => {
  for (let i = 1; i < ANCHORS.length; i++) {
    const [b0, r0] = ANCHORS[i - 1];
    const [b1, r1] = ANCHORS[i];
    if (x <= b1) return r0 + ((x - b0) / (b1 - b0)) * (r1 - r0);
  }
  return x;
};
const R = (a: number, b: number): [number, number] => [remap(a), remap(b)];

export const T = {
  // ── SENSORS ────────────────────────────────────────────────
  pirBolt: { grow: R(0.352, 0.376), head: R(0.376, 0.402), idle: 0.45 } as BoltWindow,
  pirCharge: R(0.340, 0.352),
  pirImpact: R(0.402, 0.414),
  dhtBolt: { grow: R(0.358, 0.382), head: R(0.382, 0.408), idle: 0.45 } as BoltWindow,
  dhtCharge: R(0.346, 0.358),
  dhtImpact: R(0.408, 0.420),
  espWrap: { grow: R(0.418, 0.426), head: R(0.418, 0.426), off: R(0.432, 0.442), idle: 1 } as BoltWindow,
  // ── RELAYS ─────────────────────────────────────────────────
  r1Bolt: { grow: R(0.470, 0.490), head: R(0.490, 0.510), off: R(0.582, 0.598), idle: 0.5 } as BoltWindow,
  r1Flip: R(0.510, 0.520),
  r1LoadBolt: { grow: R(0.520, 0.535), head: R(0.522, 0.540), off: R(0.582, 0.594), idle: 0.6 } as BoltWindow,
  lightOn: R(0.535, 0.545),
  r2Bolt: { grow: R(0.500, 0.520), head: R(0.520, 0.540), off: R(0.586, 0.600), idle: 0.5 } as BoltWindow,
  r2Flip: R(0.540, 0.550),
  r2LoadBolt: { grow: R(0.550, 0.565), head: R(0.552, 0.570), off: R(0.586, 0.598), idle: 0.6 } as BoltWindow,
  acOn: R(0.565, 0.575),
  energySaveOff: R(0.582, 0.600), // light + AC power down, relays flip back
  // ── CAMERA / VISION ────────────────────────────────────────
  panelA: { in: R(0.340, 0.352), out: R(0.590, 0.606) },
  panelCam: { in: R(0.596, 0.612), out: R(0.762, 0.772) },
  panelStorm: { in: R(0.690, 0.760), out: R(0.834, 0.840) },
  camRec: R(0.612, 0.618),
  camScan: R(0.612, 0.700),
  camBox: R(0.640, 0.652),
  camLabel: R(0.652, 0.662),
  camTrack: R(0.662, 0.672),
  pipe: [
    { grow: R(0.648, 0.658), head: R(0.656, 0.664), idle: 0.5 }, // CAMERA → OPENCV
    { grow: R(0.658, 0.668), head: R(0.666, 0.674), idle: 0.5 }, // OPENCV → YOLO11n
    { grow: R(0.668, 0.678), head: R(0.676, 0.684), idle: 0.5 }, // YOLO11n → FASTAPI
    { grow: R(0.678, 0.690), head: R(0.686, 0.698), idle: 0.5 }, // FASTAPI → OCCUPANCY
  ] as BoltWindow[],
  // ── STORM ──────────────────────────────────────────────────
  stormStart: remap(0.700),
  stormTrunk: (i: number): BoltWindow => ({
    grow: R(0.700 + i * 0.006, 0.740 + i * 0.006),
    head: R(0.735, 0.820),
    intensity: R(0.700, 0.820),
    idle: 1,
  }),
  stormFlashes: [remap(0.758), remap(0.789), remap(0.812)],
  stormFlashWidth: 0.007,
  // ── IMPACT / 404 ───────────────────────────────────────────
  impact: R(0.820, 0.834),
  redFlash: R(0.834, 0.838),
  shake: R(0.834, 0.852),
  glitch: R(0.838, 0.862),
  scanlines: R(0.836, 0.900),
  txt404: R(0.842, 0.848),
  warnPop: R(0.846, 0.852),
  toBlack: R(0.892, 0.900),
  // ── BOOT ───────────────────────────────────────────────────
  bootInit: R(0.910, 0.918),
  bootCheck: (i: number): [number, number] => R(0.918 + i * 0.005, 0.918 + i * 0.005 + 0.004),
  bootReady: R(0.953, 0.960),
  toPaper: R(0.952, 0.966),
} as const;
```

### 2.4 `energyTypes.ts` + `--u` stroke-scale hook

```ts
// energyTypes.ts
export type Palette = 'fire' | 'cyan';
export interface BoltWindow {
  grow: [number, number];       // trunk reveals 0→1 over this window
  head: [number, number];       // bright travelling pulse goes 0→1 over this window
  off?: [number, number];       // tail retracts (start of reveal moves 0→1)
  intensity?: [number, number]; // storm only: width + branch count scale over this window
  idle: number;                 // opacity level after the head has passed (0..1)
}
```

```ts
// useEnergyScale.ts — makes stroke widths constant in on-screen px regardless of viewBox scaling
import { useEffect } from 'react';
import type { RefObject } from 'react';

export function useEnergyScale(svgRef: RefObject<SVGSVGElement | null>): void {
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const apply = (): void => {
      const vb = svg.viewBox.baseVal;
      const w = svg.getBoundingClientRect().width;
      if (w > 0 && vb.width > 0) svg.style.setProperty('--u', (vb.width / w).toFixed(4));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(svg);
    return () => ro.disconnect();
  }, [svgRef]);
}
```

Every SVG that will host bolts must (a) have a `ref`, (b) call `useEnergyScale(ref)`. Stroke widths in the plan are written as `Npx` and applied as `calc(var(--u,1) * var(--e-w,1) * Npx)`.

### 2.5 Adapter (edit `PROGRESS_SOURCE`, ONE line)

Where the existing engine finalizes the global scroll progress (a number 0–1), add:

```ts
import { energyProgress } from './energy/energyProgress';
// …after progress is computed:
energyProgress.set(progress);
```

If the engine only has per-scene progress, compute `progress = sceneStart + sceneLocal * (sceneEnd - sceneStart)` using `SCENE_WINDOWS`, then call `energyProgress.set(progress)`. Do not create a scroll listener. On unmount of the landing page call `energyProgress.set(0)`.

DEV-only debug hook (append in `energyProgress.ts`):

```ts
if (import.meta.env.DEV) {
  (window as unknown as { __energy: typeof energyProgress }).__energy = energyProgress;
}
```

---

## 3. LIGHTNING ENGINE

### 3.1 `lightningGeometry.ts` (final code)

```ts
export interface Pt { x: number; y: number }
export interface BoltGeom {
  trunk: string;
  branches: Array<{ d: string; at: number }>;
  sparks: Array<{ x: number; y: number; at: number }>;
}
const NS = 'http://www.w3.org/2000/svg';
const r = (n: number): string => n.toFixed(2);

export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Samples the EXISTING wire path so lightning follows the existing composition. */
export function sampleGuide(d: string, n: number): { pts: Pt[]; length: number } {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('style', 'position:absolute;width:0;height:0;visibility:hidden');
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', d);
  svg.appendChild(path);
  document.body.appendChild(svg);
  const length = path.getTotalLength();
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const q = path.getPointAtLength((length * i) / n);
    pts.push({ x: q.x, y: q.y });
  }
  document.body.removeChild(svg);
  return { pts, length };
}

export function buildBolt(
  pts: Pt[],
  length: number,
  seed: number,
  ampRatio: number,
  branchCount: number,
): BoltGeom {
  const rnd = mulberry32(seed);
  const amp = ampRatio * length;
  const n = pts.length - 1;
  const out: Pt[] = [pts[0]];
  const idx: number[] = [0];

  for (let i = 1; i < n; i++) {
    const a = pts[i - 1];
    const b = pts[i + 1];
    let tx = b.x - a.x;
    let ty = b.y - a.y;
    const m = Math.hypot(tx, ty) || 1;
    tx /= m;
    ty /= m;
    const nx = -ty;
    const ny = tx;
    const t = i / n;
    const taper = Math.pow(Math.sin(Math.PI * t), 0.6); // ends stay attached to the hardware
    const sign = i % 2 === 0 ? 1 : -1;               // forced zig-zag = sharp angles
    const off = sign * (0.35 + 0.65 * rnd()) * amp * taper;
    const p = { x: pts[i].x + nx * off, y: pts[i].y + ny * off };
    out.push(p);
    idx[i] = out.length - 1;
    if (rnd() < 0.3) {
      // kink: short backwards jab
      const along = (0.25 + 0.3 * rnd()) * (length / n);
      out.push({
        x: p.x + tx * along * 0.5 - nx * sign * amp * 0.45 * taper,
        y: p.y + ty * along * 0.5 - ny * sign * amp * 0.45 * taper,
      });
    }
  }
  out.push(pts[n]);
  idx[n] = out.length - 1;

  const trunk = 'M' + out.map((q) => `${r(q.x)} ${r(q.y)}`).join(' L ');

  const branches: BoltGeom['branches'] = [];
  const sparks: BoltGeom['sparks'] = [];
  for (let k = 0; k < branchCount; k++) {
    const i = 2 + Math.floor(rnd() * Math.max(1, n - 3));
    const base = out[idx[i]];
    const prev = out[Math.max(0, idx[i] - 1)];
    let ang = Math.atan2(base.y - prev.y, base.x - prev.x);
    ang += (rnd() < 0.5 ? -1 : 1) * (0.45 + 0.5 * rnd());
    const segLen = (amp * (1.6 + 1.4 * rnd())) / 3;
    let cx = base.x;
    let cy = base.y;
    let d = `M${r(cx)} ${r(cy)}`;
    for (let s = 0; s < 3; s++) {
      ang += (rnd() - 0.5) * 0.7;
      cx += Math.cos(ang) * segLen;
      cy += Math.sin(ang) * segLen;
      d += ` L${r(cx)} ${r(cy)}`;
    }
    const at = i / n;
    branches.push({ d, at });
    sparks.push({ x: cx, y: cy, at });
  }
  for (let k = 0; k < 3; k++) {
    const i = 1 + Math.floor(rnd() * Math.max(1, n - 1));
    sparks.push({ x: out[idx[i]].x, y: out[idx[i]].y, at: i / n });
  }
  return { trunk, branches, sparks };
}
```

### 3.2 `LightningBolt.tsx` (final code)

Place the component INSIDE the same `<svg>` (same `viewBox`) as the wire it replaces, in a `<g>` directly after the wire group. Hide the old visible wire stroke but keep the old `<path>` in the DOM (`stroke="none"`, `opacity="0"`) because packet chips may ride it.

```tsx
import { useEffect, useMemo, useRef } from 'react';
import type { FC } from 'react';
import { energyProgress } from './energyProgress';
import { buildBolt, sampleGuide } from './lightningGeometry';
import { hash01, pulse, seg, smooth } from './energyMath';
import type { BoltWindow, Palette } from './energyTypes';

const PAL: Record<Palette, { outer: string; mid: string; core: string; hot: string }> = {
  fire: { outer: '#FF3D00', mid: '#FF7A1A', core: '#FFD83D', hot: '#FFFFFF' },
  cyan: { outer: '#27C7E8', mid: '#27C7E8', core: '#C8F7FF', hot: '#FFFFFF' },
};

interface Props {
  seed: number;
  guideD: string;
  palette: Palette;
  win: BoltWindow;
  ampRatio?: number;   // default 0.045 (perpendicular jag = 4.5% of guide length)
  samples?: number;    // default 14 segments along the guide
  branchCount?: number;// default 5
  headCount?: number;  // default 1
  headCycles?: number; // default 1
}

const W = (n: number): string => `calc(var(--u, 1) * var(--e-w, 1) * ${n}px)`;

export const LightningBolt: FC<Props> = ({
  seed, guideD, palette, win,
  ampRatio = 0.045, samples = 14, branchCount = 5, headCount = 1, headCycles = 1,
}) => {
  const rootRef = useRef<SVGGElement>(null);
  const bolt = useMemo(() => {
    const { pts, length } = sampleGuide(guideD, samples);
    return buildBolt(pts, length, seed, ampRatio, branchCount);
  }, [guideD, samples, seed, ampRatio, branchCount]);
  const c = PAL[palette];

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = <T extends Element>(sel: string): T[] => Array.from(root.querySelectorAll<T>(sel));
    const trunks = q<SVGPathElement>('[data-r="trunk"]');
    const heads = q<SVGPathElement>('[data-r="head"]');
    const branches = q<SVGGElement>('[data-r="branch"]');
    const sparks = q<SVGCircleElement>('[data-r="spark"]');
    const layers = q<SVGElement>('[data-op]');

    return energyProgress.subscribe((p) => {
      const end = seg(p, win.grow[0], win.grow[1]);
      const start = win.off ? seg(p, win.off[0], win.off[1]) : 0;
      const h = seg(p, win.head[0], win.head[1]);
      const I = win.intensity ? smooth(seg(p, win.intensity[0], win.intensity[1])) : 1;
      const alive = end > 0 && start < end;
      root.setAttribute('visibility', alive ? 'visible' : 'hidden');
      if (!alive) return;

      const settle = seg(p, win.head[1], win.head[1] + 0.02);
      const level = 1 - (1 - win.idle) * settle;
      const qn = Math.floor(p * 300);
      const flick = 0.8 + 0.2 * hash01(qn, seed);
      root.style.setProperty('--e-w', (1 + 0.9 * I).toFixed(3));

      const len = end - start;
      trunks.forEach((t) => {
        t.style.strokeDasharray = `${len} 2`;
        t.style.strokeDashoffset = String(-start);
      });
      layers.forEach((el) => {
        el.style.opacity = String(level * flick * Number(el.dataset.op));
      });
      heads.forEach((hd) => {
        const i = Number(hd.dataset.i);
        const hl = Number(hd.dataset.len);
        const u = (h * headCycles + i / headCount) % 1;
        hd.style.strokeDasharray = `${hl} 2`;
        hd.style.strokeDashoffset = String(hl - u * (1 + hl));
        hd.style.opacity = h > 0 && h < 1 ? '1' : '0';
      });
      branches.forEach((b) => {
        const j = Number(b.dataset.j);
        const at = Number(b.dataset.at);
        const rev = seg(end, at, at + 0.2);
        const gate = win.intensity ? (I >= (j + 1) / (branchCount + 1) ? 1 : 0) : 1;
        const fl = hash01(qn, seed + j * 13) > 0.3 ? 1 : 0.3;
        b.style.opacity = String(level * fl * gate * (1 - start));
        b.querySelectorAll<SVGPathElement>('[data-b]').forEach((bp) => {
          bp.style.strokeDasharray = `${rev} 2`;
          bp.style.strokeDashoffset = '0';
        });
      });
      sparks.forEach((s, j) => {
        const at = Number(s.dataset.at);
        const on = hash01(qn, seed + j * 7) > 0.4 ? 1 : 0;
        s.style.opacity = String(level * pulse(end, at - 0.05, at + 0.08) * on);
      });
    });
  }, [win, seed, headCount, headCycles, branchCount]);

  const trunk = (key: string, stroke: string, w: number, op: number) => (
    <path key={key} data-r="trunk" data-op={op} d={bolt.trunk} pathLength={1} fill="none"
      stroke={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ strokeWidth: W(w) }} />
  );

  return (
    <g ref={rootRef} aria-hidden="true" visibility="hidden" style={{ pointerEvents: 'none' }}>
      {trunk('sil', '#111111', 10, 1)}
      {trunk('outer', c.outer, 18, 0.32)}
      {trunk('mid', c.mid, 6, 1)}
      {trunk('core', c.core, 3.2, 1)}
      {trunk('hot', c.hot, 1.4, 0.9)}

      {bolt.branches.map((b, j) => (
        <g key={`b${j}`} data-r="branch" data-j={j} data-at={b.at}>
          <path data-b d={b.d} pathLength={1} fill="none" stroke="#111111" strokeLinecap="round" strokeLinejoin="round" style={{ strokeWidth: W(5) }} />
          <path data-b d={b.d} pathLength={1} fill="none" stroke={c.mid} strokeLinecap="round" strokeLinejoin="round" style={{ strokeWidth: W(2.4) }} />
          <path data-b d={b.d} pathLength={1} fill="none" stroke={c.hot} strokeLinecap="round" strokeLinejoin="round" style={{ strokeWidth: W(1) }} />
        </g>
      ))}

      {Array.from({ length: headCount }).map((_, i) => (
        <g key={`h${i}`}>
          <path data-r="head" data-i={i} data-len={0.22} d={bolt.trunk} pathLength={1} fill="none"
            stroke={c.mid} strokeLinecap="round" strokeLinejoin="round" style={{ strokeWidth: W(9), opacity: 0 }} />
          <path data-r="head" data-i={i} data-len={0.1} d={bolt.trunk} pathLength={1} fill="none"
            stroke={c.hot} strokeLinecap="round" strokeLinejoin="round" style={{ strokeWidth: W(4), opacity: 0 }} />
        </g>
      ))}

      {bolt.sparks.map((s, j) => (
        <circle key={`s${j}`} data-r="spark" data-at={s.at} cx={s.x} cy={s.y} fill={c.core}
          stroke="#111111" style={{ r: W(2.6), strokeWidth: W(0.8), opacity: 0 }} />
      ))}
    </g>
  );
};
```

Palette rules (fixed): **PIR = `fire`**, **DHT11 = `cyan`**, ESP32→relay = `fire`, relay→load = `fire`, camera pipeline = `cyan`, storm = mix per §4.9.

### 3.3 `ImpactBurst.tsx` (final code)

```tsx
import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import { energyProgress } from './energyProgress';
import { easeOut3, seg } from './energyMath';
import { mulberry32 } from './lightningGeometry';
import type { Palette } from './energyTypes';

interface Props {
  cx: number; cy: number;
  win: [number, number];
  size: number;          // user units. Use viewBoxWidth * 0.03 for pins, * 0.08 for the computer
  palette: Palette;
  seed: number;
  rays?: number;         // default 8 (computer: 14)
}

export const ImpactBurst: FC<Props> = ({ cx, cy, win, size, palette, seed, rays = 8 }) => {
  const ref = useRef<SVGGElement>(null);
  const rnd = mulberry32(seed);
  const angles = Array.from({ length: rays }, (_, i) => (i / rays) * Math.PI * 2 + (rnd() - 0.5) * 0.5);
  const core = palette === 'fire' ? '#FFD83D' : '#C8F7FF';
  const mid = palette === 'fire' ? '#FF7A1A' : '#27C7E8';

  useEffect(() => {
    const g = ref.current;
    if (!g) return;
    const lines = Array.from(g.querySelectorAll<SVGLineElement>('[data-ray]'));
    const ring = g.querySelector<SVGCircleElement>('[data-ring]');
    const flash = g.querySelector<SVGCircleElement>('[data-flash]');
    return energyProgress.subscribe((p) => {
      const t = seg(p, win[0], win[1]);
      g.setAttribute('visibility', t > 0 && t < 1 ? 'visible' : 'hidden');
      if (t <= 0 || t >= 1) return;
      const e = easeOut3(t);
      lines.forEach((ln, i) => {
        const a = angles[i];
        const r0 = size * 0.15;
        const r1 = size * (0.15 + 0.85 * e);
        ln.setAttribute('x1', String(cx + Math.cos(a) * r0));
        ln.setAttribute('y1', String(cy + Math.sin(a) * r0));
        ln.setAttribute('x2', String(cx + Math.cos(a) * r1));
        ln.setAttribute('y2', String(cy + Math.sin(a) * r1));
        ln.style.opacity = String(1 - t);
      });
      ring?.setAttribute('r', String(size * (0.2 + 0.8 * e)));
      if (ring) ring.style.opacity = String(1 - t);
      flash?.setAttribute('r', String(size * 0.5 * (1 - t)));
      if (flash) flash.style.opacity = String(1 - t);
    });
  }, [win, size, cx, cy, angles]);

  return (
    <g ref={ref} visibility="hidden" aria-hidden="true" style={{ pointerEvents: 'none' }}>
      <circle data-flash cx={cx} cy={cy} r={0} fill="#FFFFFF" />
      <circle data-ring cx={cx} cy={cy} r={0} fill="none" stroke={mid} style={{ strokeWidth: 'calc(var(--u,1) * 3px)' }} />
      {angles.map((_, i) => (
        <line key={i} data-ray stroke={core} strokeLinecap="round" style={{ strokeWidth: 'calc(var(--u,1) * 3px)' }} />
      ))}
    </g>
  );
};
```

### 3.4 `energy.css` (imported once by the landing entry; every selector scoped under `.landing-root`)

```css
.landing-root {
  --e-paper: #F4F0E6;  --e-ink: #111111;
  --e-void: #0B0B10;   --e-void-2: #14141C;
  --e-fire-red: #FF3D00; --e-fire-orange: #FF7A1A; --e-fire-yellow: #FFD83D;
  --e-white: #FFFFFF;  --e-cyan: #27C7E8; --e-cyan-hot: #C8F7FF;
  --e-alarm: #E53935;  --e-ok: #35C759;
}
.landing-root .e-sticker {           /* hard paper outline so black ink stays visible on dark panels */
  filter:
    drop-shadow(2px 0 0 var(--e-paper)) drop-shadow(-2px 0 0 var(--e-paper))
    drop-shadow(0 2px 0 var(--e-paper)) drop-shadow(0 -2px 0 var(--e-paper));
}
.landing-root .e-halftone {
  background-image: radial-gradient(rgba(255,216,61,.10) 1px, transparent 1.4px);
  background-size: 10px 10px;
}
.landing-root .e-scanlines {
  background-image: repeating-linear-gradient(0deg, rgba(0,0,0,.20) 0 1px, transparent 1px 3px);
}
.landing-root .e-rec { animation: e-blink 1s steps(2, jump-none) infinite; }
.landing-root .e-cursor { animation: e-blink 1s steps(2, jump-none) infinite; }
@keyframes e-blink { 50% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .landing-root .e-rec, .landing-root .e-cursor { animation: none; }
}
```

Z-order inside `STAGE` (set explicitly, low → high): background `0` · dark panels `1` · hardware `2` · energy SVG layer `3` · flash overlay `4` · 404/boot overlays `5` · UI text/CTA `6` · scrollbar `7`.

---

## 4. SCENE-BY-SCENE BEHAVIOR (all values final; all windows come from `energyTimeline.ts`)

Legend: `p` = global progress. "grow" = trunk reveal, "head" = travelling white-hot pulse, "impact" = `ImpactBurst`.

### 4.1 Scene 02 — ESP32 arrival (p 0.08–0.20) — CHANGE: only remove the black shape
- Delete `BLACK_SHAPE` (§7.2). Nothing else in this scene changes. No dark panel exists yet: the ESP32 sits directly on engineering paper.

### 4.2 Scenes 03–04 — PIR and DHT11 arrival (p 0.20–0.34)
- No change to entry animation, positions, labels.

### 4.3 Scene 05/06 — Sensor lightning (p 0.340–0.450)
Guides: `WIRES.pirToEsp`, `WIRES.dhtToEsp` (existing `d` strings).

| Step | Window | PIR (fire) | DHT11 (cyan) |
|---|---|---|---|
| Charge | pirCharge 0.340–0.352 / dhtCharge 0.346–0.358 | a mini `ImpactBurst` at the sensor connector end: `size = vbW*0.02`, `rays 6`, window = the charge window. Sensor's own group gets `translate: 0 -2px` pulse (use CSS `translate` property, NOT `transform`) via `pulse(p, charge)` | same |
| Grow | 0.352–0.376 / 0.358–0.382 | `LightningBolt seed=101 palette='fire' ampRatio=0.05 samples=14 branchCount=5`, trunk reveals from the sensor end toward ESP32 | `seed=202 palette='cyan' ampRatio=0.04 samples=14 branchCount=4` |
| Head travel | 0.376–0.402 / 0.382–0.408 | white-hot pulse sensor→ESP32 | same |
| Impact | pirImpact 0.402–0.414 / dhtImpact 0.408–0.420 | `ImpactBurst` at ESP32 pin end, `size = vbW*0.03`, `rays 8`, palette fire | `palette cyan`, `rays 8` |
| Settle | after impact | bolts hold at `idle 0.45` (dimmed, still flickering via scroll-quantized hash) | same |

Existing packet chips (`MOTION: 1`, `TEMP…`, `HUMIDITY…`) keep riding the same guide paths; their travel windows are untouched. Chips render ABOVE the bolts (z above energy layer).

### 4.4 ESP32 as the power core (p 0.402–0.450)
Do NOT add a permanent aura. Only these reactions, all driven by `p`:
1. **Status LEDs** (existing LED elements; add `data-e="led-rx"` / `led-tx"` attributes to them, don't redraw): RX LED → `#FFD83D` from `pirImpact[0]` onward; TX LED → `#27C7E8` from `dhtImpact[0]` onward; PWR LED → `#35C759` from `pirImpact[0]`. Switch = hard step at the window start, no fade. If the existing SVG has no discrete LEDs, overlay 3 circles (r = vbW*0.006) on the existing LED positions.
2. **Pin flash**: existing pin elements get `data-e="pin"`; fill → `#FFD83D` during `pulse(p, impact window)` > 0.2, otherwise original.
3. **Board jolt**: `translate: (±1.5px, ±1.5px)` on the ESP32 wrapper using `hash01(quant(p,300), 5)` only while `pulse(p, impact)>0.1`.
4. **Wrap arcs** (0.418–0.442): 3 `LightningBolt` (`seed 301,302,303`, palette fire, `ampRatio 0.10`, `samples 6`, `branchCount 2`, `win = T.espWrap`). Guides are 3 straight `M x y L x y` strings generated from `ESP32_SVG.getBBox()`: `(left-mid → top-left)`, `(top-right → right-mid)`, `(bottom-left → bottom-mid)`, inset 2% from the bbox. They flash and retract (the `off` window).
5. **Trace glints**: 4 tiny `head`-style dashes are unnecessary; skip.

### 4.5 Background dark panel A (p 0.340–0.606)
`DarkPanel` (§5.2) `A`: rect `left 6%, top 10%, width 88%, height 80%` of STAGE, jagged polygon (§5.2), level `0.80`, `in = T.panelA.in`, `out = T.panelA.out`. While `dark ≥ 0.4`, add class `e-sticker` to the hardware groups (ESP32, PIR, DHT11, RELAY1/2, LIGHT, AC).

### 4.6 Scenes 07–08 — Relays, light, AC, energy save (p 0.450–0.600)

| Element | Window | Behavior |
|---|---|---|
| ESP32→RELAY1 bolt | `T.r1Bolt` | fire, `seed 401`, `ampRatio 0.05`, `branchCount 4`; guide = existing ESP32→relay 1 wire |
| RELAY1 flip | 0.510–0.520 | relay armature/switch element rotates `0° → 18°` (`easeOut3`) via `transform: rotate()` around its pivot; on the same window `ImpactBurst` at relay input, `size vbW*0.025`, `rays 8`, fire |
| RELAY1→LIGHT bolt | `T.r1LoadBolt` | fire, `seed 402`, `ampRatio 0.045`, `branchCount 3` |
| LIGHT ON | 0.535–0.545 | light illustration: add a yellow `#FFD83D` hard-edged cone/rays group (6 straight rays, no gradient) with opacity `seg(p, lightOn)`; `ImpactBurst` at lamp, `rays 10` |
| ESP32→RELAY2 bolt | `T.r2Bolt` | same style, `seed 411` |
| RELAY2 flip | 0.540–0.550 | same as relay 1 |
| RELAY2→AC bolt | `T.r2LoadBolt` | `seed 412` |
| AC ON | 0.565–0.575 | AC illustration: 3 cyan `#27C7E8` hard-edged airflow chevrons opacity `seg(p, acOn)`; `ImpactBurst` cyan `rays 8` |
| ENERGY SAVE | 0.582–0.600 | text chips `NO PEOPLE DETECTED → ROOM IDLE → ENERGY SAVE` (existing) stay; all 4 relay/load bolts retract via their `off` windows (tail-first, so energy visibly drains from ESP32 toward the load); relays flip back `18° → 0°`; light rays + AC chevrons `opacity → 0` over `T.energySaveOff` |

### 4.7 Scene 09 — Camera / vision (p 0.596–0.700) — CHANGE: dark environment
1. **Dark panel C** (§5.2): full-bleed inside the camera region, level `0.97`, `in = T.panelCam.in`, `out = T.panelCam.out`. Shape = rectangle with a jagged 10-vertex comic edge on the left and bottom only.
2. **Camera frame screen**: overlay a `<rect>` (same bounds as existing screen) fill `#0B0B10`, opacity `seg(p, panelCam.in)`. Existing illustrated person recolored via CSS override scoped `.cam-dark .cam-person *{stroke:#F4F0E6}` (add class `cam-dark` on the camera group when panel C opacity > 0.5; no edits to the person SVG).
3. **REC**: red `#E53935` dot (`r = vbW*0.006`) + mono text `REC` — visible from `camRec`; dot uses class `e-rec`.
4. **Scanning sweep**: a horizontal 2px line, `#27C7E8`, opacity 0.85, spanning the screen width, `y = screenTop + screenH * ((seg(p, camScan) * 3) % 1)` (3 sweeps across the window; a pure function of `p`), with a 24-unit tall hard-edged `#27C7E8` α0.12 band trailing 12 units above it (rect, no gradient).
5. **Detection box**: rect stroke `#FFD83D` width `calc(var(--u)*3px)`, corner brackets only (4 L-shaped corners, each arm = 18% of box width) drawn with dash reveal over `camBox`. Box positions on the existing person figure's bounds + 6% padding.
6. **Labels** (mono, 10–11px equivalent, `#FFD83D` text on `#111` chip, 2px border `#FFD83D`): `PERSON` (visible from `camLabel`), `CONF 0.94` (same window), `TRACKING` (from `camTrack`). Top-right of screen, static chip: `SAMPLE / DEMO` (yellow face, ink border). Bottom-left mono, `#C8F7FF`: `RTSP · YOLO11n`. No names, no faces.
7. **Pipeline energy**: 4 cyan bolts, `palette 'cyan'`, `ampRatio 0.035`, `branchCount 2`, `samples 8`, seeds 501–504, windows `T.pipe[0..3]`. Guides are straight lines between the existing pipeline node boxes (`CAMERA → OPENCV → YOLO11n → FASTAPI → OCCUPANCY`); if those nodes don't exist yet, create 5 neo-brutalist chips (2px ink border, paper face, mono label, 3px hard shadow) laid out on the existing camera-scene row, and use `M x y L x y` guides between chip edge midpoints. Each chip's border switches to `#27C7E8` when its incoming bolt head arrives (`pulse` at the bolt's `head[1]`).
8. Final chip: `OCCUPANCY: 1 · OCCUPIED` (green `#35C759` face) appears at `T.pipe[3].head[1]`.

### 4.7b Panel handoff
Panel A out (0.590–0.606) and panel C in (0.596–0.612) overlap on purpose so the page never flashes light between them.

### 4.8 Scene 10 — Data explosion becomes ELECTRICAL STORM (p 0.700–0.820)
Replace only the *rendering* of the existing data-explosion lines. Guides = the existing 8 explosion paths (source→computer): `ESP32, PIR, DHT11, RELAY1, RELAY2, CAMERA, YOLO11n, BACKEND/FASTAPI`.

| i | Source | palette | seed | ampRatio | samples | branchCount | headCount | headCycles |
|---|---|---|---|---|---|---|---|---|
| 0 | ESP32 | fire | 601 | 0.07 | 18 | 9 | 3 | 3 |
| 1 | PIR | fire | 602 | 0.07 | 18 | 8 | 2 | 3 |
| 2 | DHT11 | cyan | 603 | 0.06 | 18 | 8 | 2 | 3 |
| 3 | RELAY1 | fire | 604 | 0.07 | 18 | 8 | 2 | 3 |
| 4 | RELAY2 | fire | 605 | 0.07 | 18 | 8 | 2 | 3 |
| 5 | CAMERA | cyan | 606 | 0.06 | 18 | 8 | 3 | 3 |
| 6 | YOLO11n | cyan | 607 | 0.06 | 18 | 8 | 2 | 3 |
| 7 | BACKEND | cyan | 608 | 0.06 | 18 | 8 | 2 | 3 |

`win = T.stormTrunk(i)` → trunk `i` starts growing at `0.700 + 0.006*i` and takes 0.040. Widths and branch counts scale with `intensity` over 0.700–0.820 (`--e-w` 1 → 1.9; branches unlock progressively — this is the "more branches, more energy" behavior).

Existing labels riding the lines (`OCCUPANCY: 1`, `TEMP: 28.4`, `HUMIDITY: 61`, `LIGHT: ON`, `AC: OFF`, `YOLO: 1 PERSON`) stay, get a 2px `#111` chip with paper face, and sit above the energy layer.

Storm extras (all in one new `EnergyStorm.tsx` component that renders the 8 bolts plus):
- **Dark panel S** (§5.2): full stage, level `0.94`, `in = T.panelStorm.in`. `hue`: none.
- **Ambient arcs**: 6 extra short "arc" bolts (`ampRatio 0.12`, `samples 5`, `branchCount 1`, fire/cyan alternating, seeds 611–616) that connect neighbouring hardware bounding boxes (ESP32↔PIR, ESP32↔DHT11, ESP32↔RELAY1, ESP32↔RELAY2, CAMERA↔YOLO, YOLO↔BACKEND). Windows `grow [0.740+k*0.008, 0.760+k*0.008]`, `head` same, `off [0.812, 0.822]`, `idle 0.7`. They originate from hardware, so nothing is random particles.
- **Sparks**: already inside each bolt (max 8 per bolt; total ≈ 100 circles).
- **Flashes**: `EnergyFlash` div (absolute, inset 0, z 4, background `#FFF7C2`), `opacity = 0.28 * max(pulse(p, f-0.0035, f+0.0035) for f in T.stormFlashes)`. Disabled under reduced motion.
- **Performance cap**: total SVG elements in the storm ≤ 450.

### 4.9 Scene 11 — Computer impact (p 0.820–0.834)
1. All 8 trunks end exactly at the existing computer input point (last vertex of each guide). Add `ImpactBurst` at that point: `size = vbW*0.08`, `rays 14`, palette fire, `win = T.impact`; a second one, palette cyan, `rays 10`, `win = [impact[0]+0.003, impact[1]]`.
2. Monitor screen: white overlay rect, `opacity = 0.9 * pulse(p, impact)`.
3. Monitor jolt: `translate: (±4px, ±3px)` from `hash01(quant(p,400), 9)` during `impact`.
4. Existing `CONNECTING… / SENSORS OK…` check text: keep showing until `impact[0]`, then it corrupts: for `p ∈ glitch`, each line is offset by `±(6..24)px` when `hash01(quant(p,300), lineIndex) > 0.6` (pure function of scroll).

### 4.10 Scene 12 — 404 (p 0.834–0.900)
| Layer | Window | Exact behavior |
|---|---|---|
| Red flash | `redFlash` 0.834–0.838 | full-stage overlay `#E53935`, opacity `seg(p, redFlash)`; stays 1 until `toBlack` |
| Shake | `shake` 0.834–0.852 | whole STAGE content `translate: (dx,dy)` where `dx = (hash01(quant(p,500),1)-0.5)*16*(1-seg(p,shake))`, `dy` same with salt 2 |
| Glitch slices | `glitch` 0.838–0.862 | 404 text duplicated in 4 horizontal bands (each `clip-path: inset(a% 0 b% 0)`), band `k` offset `x = ±(6..24)px` when `hash01(quant(p,300),k) > 0.6`; text-shadow `3px 0 #27C7E8, -3px 0 #111` |
| Scanlines | `scanlines` 0.836–0.900 | `.e-scanlines` overlay opacity 0.6 (static, no animation) |
| 404 text | from `txt404` | monitor screen text: `404` (Archivo 900, `#F4F0E6` on red) ~ 22vmin; below: `CLASSROOM NOT FOUND` (Archivo 800), `SYSTEM RESPONSE INTERRUPTED` (IBM Plex Mono 600) |
| Warning triangles | `warnPop` 0.846–0.852 | 4 triangles at monitor corners: fill `#FFD83D`, stroke `#111` 3px, `!` glyph; scale `easeOut3(seg(p,warnPop))` |
| Hold | 0.862–0.892 | static so it is readable |
| To black | `toBlack` 0.892–0.900 | black `#0B0B10` wipe from bottom: `clip-path: inset(${100 - 100*seg(p,toBlack)}% 0 0 0)` |
The route is NEVER changed. Do not mount `NotFoundPage`.

### 4.11 Scene 13 — Reboot (p 0.900–0.960)
- Background `#0B0B10`, text `#35C759`, IBM Plex Mono 600.
- `_` cursor (class `e-cursor`) from 0.900.
- `INITIALIZING SMART CLASSROOM...` types in over `bootInit` (characters revealed = `floor(seg(p,bootInit)*len)`).
- Checks in this order, each reveals at `T.bootCheck(i)` (i = 0..6): `SENSORS ✓`, `ESP32 ✓`, `CAMERA ✓`, `YOLO11n ✓`, `OCCUPANCY ✓`, `ENERGY ✓`, `ANALYTICS ✓` (✓ in `#35C759`, label paper-white).
- `SYSTEM READY` (Archivo 900, `#35C759`) reveals over `bootReady`.
- Paper return: `clip-path: circle(${150*seg(p,toPaper)}% at 50% 50%)` on a paper-colored layer sitting above the boot layer.

### 4.12 Scene 14 — ARE YOU READY? (p 0.960–1.000)
- Existing typography and CTA unchanged.
- Add small CTA charge (optional, hover/focus only, not scroll): 4 static 24-unit jagged bolts at the button corners, `opacity 0 → 1` in 100ms on `:hover`/`:focus-visible`. Static SVG path strings generated once with `buildBolt` seeds 701–704.

---

## 5. BACKGROUND, DARK PANELS

### 5.1 `BlueprintBackground.tsx` — replace the existing background layer's visuals (keep the same mount point/z-index 0)
Single fixed `<svg width="100%" height="100%">` with `<pattern>`s:
- paper base `#F4F0E6`.
- minor grid 24px: stroke `#111` opacity `0.07`, width 1.
- major grid 120px: stroke `#111` opacity `0.16`, width 1.
- Margin-only annotations (outer 12% left/right and 8% top/bottom; nothing inside the central 76% column):
  - ruler ticks along top and left edges: every 24px a 6px tick, every 120px a 14px tick with mono numeral 9px `#111` opacity 0.45.
  - corner registration marks: crosshair + circle r 10, stroke `#111` 1.5, opacity 0.5, at all 4 corners (inset 20px).
  - 6 orthogonal PCB traces (1.5px `#111`, opacity 0.18) with via dots (r 3) in the margins.
  - 5 symbols (resistor zig-zag, capacitor, ground, diode, inductor) 0.16 opacity, margins only.
  - title block bottom-right, mono 9px: `DWG · SMART CLASSROOM · ROOM 508` / `SHEET 01 OF 01` / `NOT TO SCALE` (no invented dimensions or part specs).
- Static. No parallax. No animation.

### 5.2 `DarkPanel.tsx` (final behavior)
```tsx
import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import { energyProgress } from './energyProgress';
import { seg } from './energyMath';

interface Props {
  rect: { left: string; top: string; width: string; height: string };
  polygon: string;                    // CSS polygon() in % of the panel box
  level: number;                      // max opacity
  win: { in: [number, number]; out?: [number, number] };
  onLevel?: (o: number) => void;      // used to toggle .e-sticker / .cam-dark
}
export const DarkPanel: FC<Props> = ({ rect, polygon, level, win, onLevel }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return energyProgress.subscribe((p) => {
      const o = level * seg(p, win.in[0], win.in[1]) * (win.out ? 1 - seg(p, win.out[0], win.out[1]) : 1);
      el.style.opacity = String(o);
      el.style.visibility = o > 0.001 ? 'visible' : 'hidden';
      onLevel?.(o);
    });
  }, [level, win, onLevel]);
  return (
    <div ref={ref} aria-hidden="true" className="e-halftone"
      style={{ position: 'absolute', zIndex: 1, background: '#0B0B10', clipPath: polygon,
               visibility: 'hidden', opacity: 0, pointerEvents: 'none', ...rect }} />
  );
};
```
Polygons (jagged comic-burst edges; tune each vertex by at most ±3%):
- Panel A: `polygon(2% 14%, 14% 6%, 30% 11%, 47% 3%, 66% 9%, 84% 4%, 98% 15%, 95% 36%, 99% 58%, 94% 82%, 80% 97%, 60% 91%, 42% 98%, 24% 92%, 8% 97%, 3% 72%, 6% 44%)`
- Panel C (camera region): `polygon(6% 0, 100% 0, 100% 100%, 0 100%, 4% 82%, 0 62%, 5% 44%, 1% 24%)`
- Panel S (storm): `inset(0)` (full stage).

The dark panels must (1) appear only from p 0.340, (2) extend well beyond the hardware bounds, (3) have jagged edges + halftone texture. They must never look like a black backing plate behind ESP32 — that was the removed defect.

---

## 6. SCROLLBAR (edit `SCROLLBAR` + its CSS only)
- Container: `position: fixed; right: 6px; top: 12vh; height: 76vh; width: 3px;` background `rgba(17,17,17,0.15)`, no border, no radius.
- Fill: same width, background `#111`; height = `100 * p %`, `transform-origin: top`, use `transform: scaleY(p)` with `height: 100%` (no layout animation).
- Remove any numbers/labels/ticks/scene names attached to it. Optional single `9px` mono percent text: delete.
- Hide the native scrollbar for the landing route only: on landing mount add class `landing-active` to `document.documentElement`, on unmount remove it. CSS: `html.landing-active{scrollbar-width:none} html.landing-active::-webkit-scrollbar{display:none}`. (The dashboard's native scrollbar must remain unchanged.)
- On dark panels the fill switches to `#FFD83D` when `dark ≥ 0.4` (class toggle).

---

## 7. REMOVALS

### 7.1 Old visible wires
For each entry in `WIRES` that now has a `LightningBolt`: keep the `<path>` element, set `stroke="none"`, `opacity="0"`, keep its `id/ref` (packet chips depend on it). Delete only the visible black/blue stroke styling for them. Remove any `stroke-dashoffset` drawing code that ONLY drives the visual wire; keep any code that drives packets.

### 7.2 `BLACK_SHAPE` (behind ESP32)
Identify it strictly by these tests, in order:
1. It is a separate element (`<rect>`, `<ellipse>`, `<path>`, or `<div>`) rendered BEFORE the ESP32 illustration in DOM order, inside the ESP32 scene.
2. Fill/background is `#111`/`#111111`/`black`/`bg-black`/`bg-[#111111]`.
3. Its bounds exceed the ESP32 board's bounds by ≥ 8% in width or height, or it is offset behind the board.
Verification method: in the browser at p≈0.14 set `display:none` on the candidate; the ESP32 illustration must remain fully intact, including its own outline and its own hard offset shadow (those belong to the ESP32 drawing and MUST stay). If the board changes, you picked the wrong element. Delete only that element and only its exclusive CSS rule. Take before/after screenshots at p=0.14 and p=0.19.

---

## 8. FILES TO CREATE (all under `LANDING_DIR/energy/`)
`energyMath.ts`, `energyProgress.ts`, `energyTypes.ts`, `energyTimeline.ts`, `useEnergyScale.ts`, `lightningGeometry.ts`, `LightningBolt.tsx`, `ImpactBurst.tsx`, `DarkPanel.tsx`, `EnergyStorm.tsx`, `EnergyFlash.tsx`, `BlueprintBackground.tsx`, `NotFound404Overlay.tsx` (if the existing 404 scene can't be extended in place), `blastTransition.ts`, `energy.css`. Plus root file `LANDING_MAP.md` (Step A output).

## 9. FILES TO MODIFY (minimal edits only)
| File | Edit |
|---|---|
| `PROGRESS_SOURCE` | add the one `energyProgress.set(progress)` line + reset on unmount |
| scene SVGs hosting wires (`WIRES`) | mount `<LightningBolt>` / `<ImpactBurst>` groups after the wire group; call `useEnergyScale`; set old wire stroke to none |
| `ESP32_SVG` | add `data-e` attributes to LEDs and pins; remove `BLACK_SHAPE` |
| `RELAY1/2`, `LIGHT`, `AC` | add pivot/`data-e` hooks needed for §4.6 (rotate, ray groups); no redraw |
| `CAMERA` scene | add dark overlay rect, scan line, detection box, labels, chips |
| `COMPUTER` scene | mount impact + glitch overlays |
| `NOT_FOUND_SCENE`, `BOOT_SCENE` | drive by `T.*` windows exactly as §4.10–4.11 |
| `CTA` handler | replace the visual transition with `triggerBlast` (§10); keep `NAV_TARGET` unchanged |
| `SCROLLBAR` + `LANDING_CSS` | §6, §3.4 import |
| background layer | swap contents for `BlueprintBackground` |

## 10. FILES THAT MUST NOT BE MODIFIED
`apps/web/src/pages/*` (all dashboard pages), `components/layout/*`, `components/features/*`, `app/router.tsx`, `App.tsx`, `main.tsx`, `services/*`, `types/*`, `lib/styles.ts`, `index.css` (global), `apps/web/package.json`, everything under `services/` and `scripts/`, `.env*`.

---

## 11. DASHBOARD BLAST (`blastTransition.ts`)

Click is time-based (one-shot). Runs on `requestAnimationFrame`, uses an overlay appended to `document.body` (NOT inside the landing tree) so it survives the SPA route change.

Timeline (ms from click):

| t | Effect |
|---|---|
| 0–140 | CTA physically presses (existing `:active` translate 4px, shadow 0). 6 short bolts (60–110px) radiate from the button center, drawn instantly with 4 layers |
| 140–460 | 12 bolts expand from the button center to the viewport edges (`easeOut3`), branches 4 each; dark overlay `#0B0B10` opacity 0→0.85 during 140–300 |
| 300–560 | landing STAGE `transform: scale(1→1.9)`, origin = button center, `easeIn2` (camera zooms forward) |
| 460–620 | flash overlay `#FFF7C2` opacity 0→1 (460–540), hold to 620 |
| 560 | call `navigate(NAV_TARGET)` — SPA navigation, no reload |
| 620–900 | overlay opacity 1→0 (`easeOut3`) revealing the real dashboard |
| 920 | remove overlay node, restore `documentElement.style.overflow` |

```ts
import { buildBolt } from './lightningGeometry';
import { easeIn2, easeOut3, seg } from './energyMath';

const NS = 'http://www.w3.org/2000/svg';
const LAYERS = [
  { c: '#111111', w: 10 }, { c: '#FF7A1A', w: 6 }, { c: '#FFD83D', w: 3.2 }, { c: '#FFFFFF', w: 1.4 },
];

export function triggerBlast(origin: DOMRect, onNavigate: () => void, stage: HTMLElement | null): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { onNavigate(); return; }
  const vw = window.innerWidth, vh = window.innerHeight;
  const cx = origin.left + origin.width / 2, cy = origin.top + origin.height / 2;
  const R = Math.hypot(vw, vh);

  const root = document.createElement('div');
  root.setAttribute('aria-hidden', 'true');
  root.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;';
  const dark = document.createElement('div');
  dark.style.cssText = 'position:absolute;inset:0;background:#0B0B10;opacity:0;';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
  svg.setAttribute('width', String(vw)); svg.setAttribute('height', String(vh));
  svg.style.cssText = 'position:absolute;inset:0;';
  const flash = document.createElement('div');
  flash.style.cssText = 'position:absolute;inset:0;background:#FFF7C2;opacity:0;';
  root.append(dark, svg, flash);
  document.body.appendChild(root);
  document.documentElement.style.overflow = 'hidden';

  type B = { paths: SVGPathElement[]; start: number; end: number; len: number; branches: SVGPathElement[][] };
  const bolts: B[] = [];
  const make = (i: number, count: number, len: number, t0: number, t1: number): void => {
    const a = (i / count) * Math.PI * 2 + i * 0.37;
    const pts = Array.from({ length: 13 }, (_, k) => ({
      x: cx + Math.cos(a) * len * (k / 12), y: cy + Math.sin(a) * len * (k / 12),
    }));
    const g = buildBolt(pts, len, 900 + i * 17, 0.06, 4);
    const paths = LAYERS.map((L) => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', g.trunk); p.setAttribute('pathLength', '1'); p.setAttribute('fill', 'none');
      p.setAttribute('stroke', L.c); p.setAttribute('stroke-width', String(L.w));
      p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round');
      p.style.strokeDasharray = '0 2'; svg.appendChild(p); return p;
    });
    const branches = g.branches.map((b) => LAYERS.slice(1).map((L, li) => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', b.d); p.setAttribute('pathLength', '1'); p.setAttribute('fill', 'none');
      p.setAttribute('stroke', L.c); p.setAttribute('stroke-width', String(L.w * 0.5 + li * 0));
      p.setAttribute('stroke-linecap', 'round'); p.style.strokeDasharray = '0 2'; svg.appendChild(p); return p;
    }));
    bolts.push({ paths, start: t0, end: t1, len, branches });
  };
  for (let i = 0; i < 6; i++) make(i, 6, 60 + (i % 3) * 25, 0, 140);
  for (let i = 0; i < 12; i++) make(i + 6, 12, R * 0.6, 140, 460);

  const t0 = performance.now();
  let navigated = false;
  const tick = (now: number): void => {
    const t = now - t0;
    bolts.forEach((b) => {
      const e = easeOut3(seg(t, b.start, b.end));
      b.paths.forEach((p) => { p.style.strokeDasharray = `${e} 2`; });
      b.branches.forEach((bp) => bp.forEach((p) => { p.style.strokeDasharray = `${seg(e, 0.3, 0.8)} 2`; }));
    });
    dark.style.opacity = String(0.85 * seg(t, 140, 300));
    if (stage) {
      const s = 1 + 0.9 * easeIn2(seg(t, 300, 560));
      stage.style.transformOrigin = `${cx}px ${cy}px`;
      stage.style.transform = `scale(${s})`;
    }
    const fl = t < 620 ? seg(t, 460, 540) : 1 - easeOut3(seg(t, 620, 900));
    flash.style.opacity = String(fl);
    svg.style.opacity = t < 620 ? '1' : String(1 - seg(t, 620, 760));
    if (!navigated && t >= 560) { navigated = true; onNavigate(); }
    if (t < 920) requestAnimationFrame(tick);
    else { root.remove(); document.documentElement.style.overflow = ''; }
  };
  requestAnimationFrame(tick);
}
```
CTA handler: `onClick={(e) => triggerBlast(e.currentTarget.getBoundingClientRect(), () => navigate(NAV_TARGET), stageRef.current)}` — keep the exact existing `navigate` call/route. Keyboard activation (Enter/Space) goes through the same handler. Guard against double-click with a `useRef<boolean>`.

---

## 12. REVERSE SCROLL RULES
- Every visual in §4 is computed from `p` only (dash offsets, opacities, `translate`, `clip-path`, text reveal counts). No state machines, no "has played" flags.
- Retracting bolts use the `off` window (tail retracts first), so reverse scrolling shows energy withdrawing.
- The blast is not scroll-driven and is never reversible; it fires only from the CTA.
- Reset test (required): `__energy.set(0.9)` → `__energy.set(0.3)` → `__energy.set(0.9)` must produce DOM attribute snapshots identical to a fresh load at 0.9 (§14).

## 13. REDUCED MOTION / ACCESSIBILITY / RESPONSIVE / PERFORMANCE

**Reduced motion** (`prefers-reduced-motion: reduce`): render `<LightningBolt>` at its final state (`end=1,start=0,level=win.idle`) with no flicker (`flick=1`, branches at opacity 0.6), no storm flashes, no shake, no glitch offsets, no scan sweep, static detection box, boot lines all visible in sequence with no typing, `triggerBlast` = immediate `navigate`. Scenes stay stacked readable and CTA reachable.

**Accessibility**: all energy SVG/overlay elements `aria-hidden="true"` and `pointer-events:none`; the CTA remains a real `<button>` with visible focus ring (3px `#111` outline, 3px offset); 404 text is real text; color never carries meaning alone (labels always present).

**Responsive**:
- Desktop ≥1024: as specified.
- Tablet 640–1023: `samples 10`, `branchCount` −2, storm uses 6 trunks (drop BACKEND and RELAY2 trunks), ambient arcs 3.
- Mobile <640: `samples 8`, `branchCount` ≤3, storm 4 trunks (ESP32, PIR/DHT11 merged as one guide, CAMERA, YOLO), no ambient arcs, no `e-sticker` filters (use panel level 0.6 instead), flashes off, wrap arcs off. Story order and labels preserved.
- Detect tier once with `matchMedia`; pass counts as props; do not re-render on scroll.

**Performance budget**:
- Bolt updates are imperative attribute writes inside one subscription each; no React state per frame.
- Max energy SVG nodes at once: 450. Max simultaneously visible bolts: 24.
- Blur is NOT used. Glow = the wide `outer` stroke at 0.32 opacity.
- `e-sticker` (drop-shadow ×4) only on 8 hardware groups and only while a dark panel is ≥0.4; if DevTools shows <50 fps on a mid laptop, drop `e-sticker` and raise the `#0B0B10` panels' minimum contrast by lowering panel A level to 0.55.
- Nothing animates `top/left/width/height`; only `transform`, `translate`, `opacity`, `clip-path`, stroke dash properties.
- `will-change: transform` only on STAGE during the blast (set at click, removed at end).

---

## 14. IMPLEMENTATION ORDER
1. Step A → write `LANDING_MAP.md`.
2. Create foundation files (§2), `energy.css`, DEV debug hook. Run `npm run build` → must pass.
3. Wire the single adapter line. Verify with `__energy.set(0.5)` that subscriptions fire.
4. Remove `BLACK_SHAPE` (§7.2). Screenshot p=0.14, 0.19.
5. `BlueprintBackground` + scrollbar (§5.1, §6).
6. PIR/DHT11 bolts + ESP32 reactions + dark panel A (§4.3–4.5). Screenshot p = 0.36, 0.39, 0.41, 0.43.
7. Relay/load bolts + relay flips + energy save (§4.6). Screenshot p = 0.48, 0.53, 0.57, 0.595.
8. Camera scene (§4.7). Screenshot p = 0.61, 0.645, 0.66, 0.69.
9. Storm (§4.8) + computer impact (§4.9). Screenshot p = 0.72, 0.76, 0.79, 0.815, 0.828.
10. 404 + boot + ready (§4.10–4.12). Screenshot p = 0.836, 0.845, 0.87, 0.90, 0.93, 0.955, 0.98.
11. Blast (§11) with real navigation. Record a screen capture.
12. Responsive tiers, reduced-motion path.
13. Self-review checklist (§15). Fix, re-run. Do not rebuild anything.

## 15. TEST PLAN + ACCEPTANCE (map of the 13 self-review questions)

Automated/manual checks (use `__energy.set(p)` in dev):
1. **Determinism**: for p in [0.36, 0.41, 0.53, 0.66, 0.79, 0.85, 0.93] capture `outerHTML` of the energy layer, then `set(0.9)`, `set(0.3)`, `set(p)` and compare to a fresh `set(p)` → identical.
2. **No timers**: `grep -rn "setInterval\|setTimeout" LANDING_DIR/energy` returns nothing.
3. **No new deps**: `git diff apps/web/package.json` empty.
4. **Build/lint**: `npm run build` and `npm run lint` pass.
5. **Route**: after CTA click, URL equals the pre-existing `NAV_TARGET`, no full reload (verify `performance.getEntriesByType('navigation')` count unchanged), dashboard renders untouched.
6. **Reduced motion**: emulate in DevTools; scroll whole page; all scenes readable, CTA works, no flashes.
7. **FPS**: DevTools Performance during a 10-second continuous scroll through 0.70–0.83; ≥ 50 fps target; energy nodes ≤ 450.

Acceptance (all must be YES):
1. ESP32 reads as the power core (LEDs, pins, jolt, wrap arcs) with no permanent aura.
2. Connections are jagged multi-layer lightning (black silhouette, orange/yellow or cyan body, white-hot core, branches, sparks) — no smooth cables anywhere.
3. A bright pulse visibly travels sensor→ESP32 and hits with a burst; PIR is fire-colored, DHT11 cyan/white.
4. Relay lightning reaches relays, relays flip, light rays / AC chevrons respond; energy-save drains the bolts back.
5. Camera scene is a dark machine-vision environment with REC, cyan scan, yellow detection box, `PERSON / CONF 0.94 / TRACKING`, and a visible `SAMPLE / DEMO` tag.
6. Camera→OpenCV→YOLO11n→FastAPI→Occupancy uses cyan energy links, not lines.
7. Storm: 8 trunks converge from real hardware positions, intensify (width, branches, heads), background goes to `#0B0B10`, max 3 low-opacity flashes.
8. Energy physically enters the computer; impact burst, screen flash, glitch, red 404 with scanlines/shake/warning triangles, short.
9. Reboot on black with green checks, `SYSTEM READY`, then paper returns and `ARE YOU READY?` appears.
10. CTA click produces impulse → expanding lightning → zoom → flash → real dashboard, no reload.
11. Scrollbar is 3px wide and visually quiet.
12. Background is visibly stronger (grid 0.07/0.16, margin drafting marks) and not cluttered in the central column.
13. The black shape behind the ESP32 is gone; ESP32 illustration unchanged.
14. Scrolling back up reverses every effect cleanly (no stuck bolts, no stuck panels).
15. Dashboard and every non-landing file are byte-identical to before (`git diff --stat` shows only §8/§9 files).
