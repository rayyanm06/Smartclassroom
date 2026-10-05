export type Palette = 'fire' | 'cyan';

export interface BoltWindow {
  grow: [number, number];       // trunk reveals 0→1 over this window
  head: [number, number];       // bright travelling pulse goes 0→1 over this window
  off?: [number, number];       // tail retracts (start of reveal moves 0→1)
  intensity?: [number, number]; // storm only: width + branch count scale over this window
  idle: number;                 // opacity level after the head has passed (0..1)
}
