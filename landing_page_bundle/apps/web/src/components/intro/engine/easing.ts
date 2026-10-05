export type EasingFn = (t: number) => number;

export const linear: EasingFn = (t) => t;

export const inOutSine: EasingFn = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

export const outCubic: EasingFn = (t) => 1 - Math.pow(1 - t, 3);

export const inOutCubic: EasingFn = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const outQuart: EasingFn = (t) => 1 - Math.pow(1 - t, 4);

export const steps = (n: number): EasingFn => {
  return (t) => Math.min(1, Math.floor(t * n) / n);
};
