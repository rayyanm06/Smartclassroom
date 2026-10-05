import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import { energyProgress } from './energyProgress';
import { seg } from './energyMath';

interface Props {
  rect: { left: string; top: string; width: string; height: string };
  polygon: string; // CSS polygon() in % of the panel box
  level: number; // max opacity
  win: { in: [number, number]; out?: [number, number] };
  onLevel?: (o: number) => void; // used to toggle .e-sticker / .cam-dark
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
    <div
      ref={ref}
      aria-hidden="true"
      className="e-halftone"
      style={{
        position: 'absolute',
        zIndex: 1,
        background: '#0B0B10',
        clipPath: polygon,
        visibility: 'hidden',
        opacity: 0,
        pointerEvents: 'none',
        ...rect,
      }}
    />
  );
};
