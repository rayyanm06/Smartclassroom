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
