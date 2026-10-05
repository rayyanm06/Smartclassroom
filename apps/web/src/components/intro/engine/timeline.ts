import type { Chapter, CameraKeyframe, LayoutMode } from './types';
import { linear, inOutSine, inOutCubic } from './easing';
import type { EasingFn } from './easing';

export function clamp01(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x;
}

export function seg(p: number, a: number, b: number, ease: EasingFn = linear): number {
  if (p <= a) return 0;
  if (p >= b) return 1;
  const t = (p - a) / (b - a);
  return ease(clamp01(t));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function keyframes(
  p: number,
  points: readonly (readonly [number, number])[],
  ease: EasingFn = linear
): number {
  if (points.length === 0) return 0;
  if (points.length === 1) return points[0][1];
  if (p <= points[0][0]) return points[0][1];
  if (p >= points[points.length - 1][0]) return points[points.length - 1][1];

  for (let i = 0; i < points.length - 1; i++) {
    const [p0, v0] = points[i];
    const [p1, v1] = points[i + 1];
    if (p >= p0 && p <= p1) {
      const t = seg(p, p0, p1, ease);
      return lerp(v0, v1, t);
    }
  }
  return points[points.length - 1][1];
}

export function hash01(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export const CH: readonly Chapter[] = [
  { key: 'intro', sceneNum: '01', name: 'EMPTY CLASSROOM', start: 0, end: 8 },
  { key: 'esp32', sceneNum: '02', name: 'ESP32 BRAIN', start: 8, end: 20 },
  { key: 'pir', sceneNum: '03', name: 'PIR MOTION', start: 20, end: 27 },
  { key: 'dht', sceneNum: '04', name: 'DHT11 ENVIRONMENT', start: 27, end: 34 },
  { key: 'wires', sceneNum: '05', name: 'WIRES CONNECT', start: 34, end: 41 },
  { key: 'packets', sceneNum: '06', name: 'DATA PACKETS', start: 41, end: 45.5 },
  { key: 'relays', sceneNum: '07', name: 'RELAY MODULES', start: 45, end: 54 },
  { key: 'energy', sceneNum: '08', name: 'ENERGY CONTROL', start: 54, end: 60 },
  { key: 'vision', sceneNum: '09', name: 'VISION LAYER', start: 60, end: 70 },
  { key: 'explode', sceneNum: '10', name: 'DATA TRUNKS', start: 70, end: 82 },
  { key: 'computer', sceneNum: '11', name: 'COMPUTER HOST', start: 82, end: 87.4 },
  { key: 'glitch', sceneNum: '12', name: 'LINK LOST · 404', start: 87.4, end: 90 },
  { key: 'reboot', sceneNum: '13', name: 'SYSTEM REBOOT', start: 90, end: 96 },
  { key: 'ready', sceneNum: '14', name: 'ARE YOU READY?', start: 96, end: 100 },
] as const;

export function getChapterByProgress(p: number): Chapter {
  for (let i = CH.length - 1; i >= 0; i--) {
    if (p >= CH[i].start) return CH[i];
  }
  return CH[0];
}

export const W = {
  introHintOut: [0.5, 2.0] as const,
  introTitleOut: [2.5, 7.0] as const,
  introAnnot: [3.0, 7.0] as const,
  roomGhost: [8.0, 14.0] as const,

  esp32Rise: [7.0, 13.5] as const,
  esp32Settle: [13.5, 15.5] as const,
  brainTitleIn: [11.5, 13.5] as const,
  brainTitleOut: [19.0, 21.0] as const,
  esp32Activation: [15.3, 16.3] as const,
  calloutMcu: [15.4, 16.2] as const,
  calloutWifi: [16.1, 16.9] as const,
  calloutGpio: [16.8, 17.6] as const,
  calloutEdge: [17.5, 18.3] as const,
  cameraPush: [17.0, 20.0] as const,

  pirInA: [20.0, 24.5] as const,
  pirInB: [24.5, 26.0] as const,
  pirLabels: [24.8, 26.5] as const,

  dhtInA: [27.0, 31.5] as const,
  dhtInB: [31.5, 33.0] as const,
  dhtLabels: [31.8, 33.5] as const,

  pirWireSig: [34.0, 36.5] as const,
  pirWireVcc: [34.5, 37.0] as const,
  pirWireGnd: [35.0, 37.5] as const,
  pirWirePulse: [36.5, 37.4] as const,

  dhtWireSig: [36.0, 38.5] as const,
  dhtWireVcc: [36.5, 39.0] as const,
  dhtWireGnd: [37.0, 39.5] as const,
  dhtWirePulse: [38.5, 39.4] as const,

  signalConnectedStamp: [39.8, 40.4] as const,

  pktMotion: [41.0, 43.6] as const,
  pktTemp: [41.8, 44.4] as const,
  pktHum: [42.6, 45.2] as const,

  relay1In: [45.0, 47.5] as const,
  relay2In: [46.0, 48.5] as const,
  relay1Sig: [47.5, 49.5] as const,
  relay2Sig: [48.5, 50.5] as const,
  relayLabels: [47.5, 50.0] as const,

  lightIn: [49.5, 52.0] as const,
  acIn: [50.5, 53.0] as const,
  load1Wire: [52.0, 53.5] as const,
  load2Wire: [53.0, 54.5] as const,
  lever1On: [53.0, 53.5] as const,
  lever2On: [53.9, 54.3] as const,
  lightOn: [53.5, 54.3] as const,
  acOn: [54.3, 55.0] as const,

  noPeople: [55.2, 55.9] as const,
  roomIdle: [56.0, 56.6] as const,
  energySave: [56.8, 57.4] as const,
  senseChip: [55.2, 55.8] as const,
  decideChip: [56.4, 57.0] as const,
  actChip: [57.6, 58.2] as const,
  pktMotion0: [55.0, 56.4] as const,
  cmdOffPackets: [57.4, 58.6] as const,
  lever1Off: [58.3, 58.8] as const,
  lever2Off: [58.6, 59.1] as const,
  lightOff: [58.6, 59.2] as const,
  acOff: [59.0, 59.6] as const,
  loadLabels: [59.2, 60.0] as const,

  visionTitleIn: [61.5, 63.0] as const,
  visionTitleOut: [69.0, 70.2] as const,
  phoneIn: [61.0, 63.5] as const,
  frameOpen: [62.5, 63.8] as const,
  rtspWire: [63.5, 64.5] as const,
  personWalk: [64.0, 66.5] as const,
  detectBox: [66.5, 67.3] as const,
  detectLabel: [66.5, 68.2] as const,
  countPlate: [68.4, 69.6] as const,
  occupiedStamp: [69.0, 69.8] as const,
  privacyStamp: [67.5, 70.5] as const,
  lever1BackOn: [69.4, 69.9] as const,
  lightBackOn: [69.9, 70.8] as const,

  monitorRise: [70.5, 73.0] as const,
  lineEsp32: [70.5, 72.5] as const,
  linePir: [70.8, 74.5] as const,
  lineRelay1: [71.2, 73.6] as const,
  lineRelay2: [71.6, 74.0] as const,
  lineDhtTemp: [72.0, 76.0] as const,
  lineDhtHum: [72.4, 76.4] as const,
  lineYolo: [72.8, 77.5] as const,
  dataPackets: [76.0, 80.6] as const,

  computerPush: [82.0, 87.4] as const,
  connecting: [81.0, 83.0] as const,
  checkSensors: [83.2, 83.8] as const,
  checkEsp32: [83.9, 84.5] as const,
  checkCamera: [84.6, 85.2] as const,
  checkYolo: [85.3, 85.9] as const,
  checkDatabase: [86.0, 86.6] as const,
  crack: [87.0, 87.6] as const,
  shake: [87.4, 89.5] as const,

  redCut: [87.9, 88.05] as const,
  screen404Swap: 88.0,
  scanline: [88.2, 89.4] as const,
  interruptedText: [88.6, 89.6] as const,
  rebootBar: [89.5, 90.0] as const,

  darkCut: [90.0, 90.4] as const,
  pushIntoScreen: [90.0, 92.0] as const,
  cursorBlink: [91.4, 92.2] as const,
  typedInit: [92.2, 93.3] as const,
  bootCheckSensors: [93.3, 93.65] as const,
  bootCheckEsp32: [93.65, 94.0] as const,
  bootCheckCamera: [94.0, 94.35] as const,
  bootCheckYolo: [94.35, 94.7] as const,
  bootCheckOccupancy: [94.7, 95.05] as const,
  bootCheckEnergy: [95.05, 95.4] as const,
  bootCheckAnalytics: [95.4, 95.75] as const,
  systemReady: [95.6, 96.0] as const,
  terminalFade: [96.0, 96.6] as const,
  paperReturn: [96.0, 96.6] as const,

  readyAre: [96.6, 97.1] as const,
  readyYou: [97.0, 97.5] as const,
  readyReady: [97.4, 97.9] as const,
  readySub: [98.0, 98.6] as const,
  ctaIn: [98.4, 99.1] as const,
  ctaEnabled: 98.8,
} as const;

export const CAMERA_LANDSCAPE: readonly CameraKeyframe[] = [
  { p: 0, cx: 1200, cy: 610, z: 1.00 },
  { p: 8, cx: 1200, cy: 600, z: 1.08 },
  { p: 14, cx: 1200, cy: 600, z: 1.06 },
  { p: 20, cx: 1200, cy: 590, z: 1.32 },
  { p: 27, cx: 1200, cy: 600, z: 1.00 },
  { p: 41, cx: 1200, cy: 600, z: 1.00 },
  { p: 45, cx: 1200, cy: 640, z: 1.05 },
  { p: 52, cx: 1200, cy: 940, z: 0.78 },
  { p: 60, cx: 1200, cy: 950, z: 0.78 },
  { p: 63, cx: 2790, cy: 700, z: 1.00 },
  { p: 70, cx: 2790, cy: 700, z: 1.08 },
  { p: 73, cx: 1500, cy: 1400, z: 0.45 },
  { p: 82, cx: 1500, cy: 1400, z: 0.45 },
  { p: 85.5, cx: 1200, cy: 1900, z: 1.10 },
  { p: 87.4, cx: 1200, cy: 1900, z: 1.25 },
  { p: 90, cx: 1200, cy: 1900, z: 1.25 },
  { p: 92, cx: 1200, cy: 1900, z: 2.60 },
  { p: 100, cx: 1200, cy: 1900, z: 2.60 },
] as const;

export const CAMERA_PORTRAIT: readonly CameraKeyframe[] = [
  { p: 0, cx: 450, cy: 800, z: 1.00 },
  { p: 8, cx: 450, cy: 820, z: 1.05 },
  { p: 14, cx: 450, cy: 900, z: 1.05 },
  { p: 20, cx: 450, cy: 900, z: 1.12 },
  { p: 27, cx: 450, cy: 900, z: 1.00 },
  { p: 45, cx: 450, cy: 900, z: 1.00 },
  { p: 52, cx: 450, cy: 2050, z: 0.95 },
  { p: 60, cx: 450, cy: 2050, z: 0.95 },
  { p: 63, cx: 450, cy: 3000, z: 1.00 },
  { p: 70, cx: 450, cy: 3000, z: 1.04 },
  { p: 73, cx: 450, cy: 2200, z: 0.36 },
  { p: 82, cx: 450, cy: 2200, z: 0.36 },
  { p: 85.5, cx: 450, cy: 3990, z: 1.00 },
  { p: 87.4, cx: 450, cy: 3990, z: 1.06 },
  { p: 90, cx: 450, cy: 3990, z: 1.06 },
  { p: 92, cx: 450, cy: 3990, z: 2.40 },
  { p: 100, cx: 450, cy: 3990, z: 2.40 },
] as const;

export function getCameraAt(p: number, layout: LayoutMode): { cx: number; cy: number; z: number } {
  const table = layout === 'PORTRAIT' ? CAMERA_PORTRAIT : CAMERA_LANDSCAPE;
  if (p <= table[0].p) {
    return { cx: table[0].cx, cy: table[0].cy, z: table[0].z };
  }
  if (p >= table[table.length - 1].p) {
    const last = table[table.length - 1];
    return { cx: last.cx, cy: last.cy, z: last.z };
  }

  for (let i = 0; i < table.length - 1; i++) {
    const k0 = table[i];
    const k1 = table[i + 1];
    if (p >= k0.p && p <= k1.p) {
      const ease = (p >= 17 && p <= 27) || (p >= 45 && p <= 63) || (p >= 70 && p <= 85.5) || (p >= 90 && p <= 92)
        ? inOutCubic
        : inOutSine;
      const t = seg(p, k0.p, k1.p, ease);
      return {
        cx: lerp(k0.cx, k1.cx, t),
        cy: lerp(k0.cy, k1.cy, t),
        z: lerp(k0.z, k1.z, t),
      };
    }
  }

  return { cx: table[0].cx, cy: table[0].cy, z: table[0].z };
}
