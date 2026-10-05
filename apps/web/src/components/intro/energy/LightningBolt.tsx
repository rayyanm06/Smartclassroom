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
  seed,
  guideD,
  palette,
  win,
  ampRatio = 0.045,
  samples = 14,
  branchCount = 5,
  headCount = 1,
  headCycles = 1,
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
    <path
      key={key}
      data-r="trunk"
      data-op={op}
      d={bolt.trunk}
      pathLength={1}
      fill="none"
      stroke={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ strokeWidth: W(w) }}
    />
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
          <path
            data-b
            d={b.d}
            pathLength={1}
            fill="none"
            stroke="#111111"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ strokeWidth: W(5) }}
          />
          <path
            data-b
            d={b.d}
            pathLength={1}
            fill="none"
            stroke={c.mid}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ strokeWidth: W(2.4) }}
          />
          <path
            data-b
            d={b.d}
            pathLength={1}
            fill="none"
            stroke={c.hot}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ strokeWidth: W(1) }}
          />
        </g>
      ))}

      {Array.from({ length: headCount }).map((_, i) => (
        <g key={`h${i}`}>
          <path
            data-r="head"
            data-i={i}
            data-len={0.22}
            d={bolt.trunk}
            pathLength={1}
            fill="none"
            stroke={c.mid}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ strokeWidth: W(9), opacity: 0 }}
          />
          <path
            data-r="head"
            data-i={i}
            data-len={0.1}
            d={bolt.trunk}
            pathLength={1}
            fill="none"
            stroke={c.hot}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ strokeWidth: W(4), opacity: 0 }}
          />
        </g>
      ))}

      {bolt.sparks.map((s, j) => (
        <circle
          key={`s${j}`}
          data-r="spark"
          data-at={s.at}
          cx={s.x}
          cy={s.y}
          fill={c.core}
          stroke="#111111"
          style={{ r: W(2.6), strokeWidth: W(0.8), opacity: 0 }}
        />
      ))}
    </g>
  );
};
