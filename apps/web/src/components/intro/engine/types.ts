export type LayoutMode = 'LANDSCAPE' | 'PORTRAIT';

export interface TrackContext {
  progress: number;
  targetProgress: number;
  chapter: string;
  layout: LayoutMode;
  isReducedMotion: boolean;
  isFrozen: boolean;
}

export type TrackFn = (p: number, ctx: TrackContext) => void;

export interface StageContextValue {
  registerTrack: (fn: TrackFn) => () => void;
  progress: number;
  layout: LayoutMode;
  isReducedMotion: boolean;
  scrollToProgress: (p: number, instant?: boolean) => void;
}

export interface CameraKeyframe {
  p: number;
  cx: number;
  cy: number;
  z: number;
}

export type ChapterKey =
  | 'intro'
  | 'esp32'
  | 'pir'
  | 'dht'
  | 'wires'
  | 'packets'
  | 'relays'
  | 'energy'
  | 'vision'
  | 'explode'
  | 'computer'
  | 'glitch'
  | 'reboot'
  | 'ready';

export interface Chapter {
  key: ChapterKey;
  sceneNum: string;
  name: string;
  start: number;
  end: number;
}

export type ProgressWindow = readonly [number, number];
