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
  if (typeof document === 'undefined') {
    return { pts: [{ x: 0, y: 0 }, { x: 100, y: 100 }], length: 141.4 };
  }
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
