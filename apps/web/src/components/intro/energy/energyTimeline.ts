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
