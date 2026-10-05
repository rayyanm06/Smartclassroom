import { useEffect, useMemo, useRef } from 'react';
import type { FC } from 'react';
import { energyProgress } from './energyProgress';
import { easeOut3, seg } from './energyMath';
import { mulberry32 } from './lightningGeometry';
import type { Palette } from './energyTypes';

interface Props {
  cx: number;
  cy: number;
  win: [number, number];
  size: number; // user units. Use viewBoxWidth * 0.03 for pins, * 0.08 for the computer
  palette: Palette;
  seed: number;
  rays?: number; // default 8 (computer: 14)
}

export const ImpactBurst: FC<Props> = ({ cx, cy, win, size, palette, seed, rays = 8 }) => {
  const ref = useRef<SVGGElement>(null);
  const angles = useMemo(() => {
    const rnd = mulberry32(seed);
    return Array.from({ length: rays }, (_, i) => (i / rays) * Math.PI * 2 + (rnd() - 0.5) * 0.5);
  }, [seed, rays]);

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
      <circle
        data-ring
        cx={cx}
        cy={cy}
        r={0}
        fill="none"
        stroke={mid}
        style={{ strokeWidth: 'calc(var(--u,1) * 3px)' }}
      />
      {angles.map((_, i) => (
        <line
          key={i}
          data-ray
          stroke={core}
          strokeLinecap="round"
          style={{ strokeWidth: 'calc(var(--u,1) * 3px)' }}
        />
      ))}
    </g>
  );
};
