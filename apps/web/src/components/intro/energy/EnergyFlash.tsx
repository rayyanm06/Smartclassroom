import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import { energyProgress } from './energyProgress';
import { pulse } from './energyMath';
import { T } from './energyTimeline';

export const EnergyFlash: FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.display = 'none';
      return;
    }

    return energyProgress.subscribe((p) => {
      let maxP = 0;
      const hw = T.stormFlashWidth / 2;
      for (const f of T.stormFlashes) {
        const val = pulse(p, f - hw, f + hw);
        if (val > maxP) maxP = val;
      }
      const op = 0.28 * maxP;
      el.style.opacity = op.toFixed(3);
      el.style.visibility = op > 0.01 ? 'visible' : 'hidden';
    });
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 4,
        backgroundColor: '#FFF7C2',
        opacity: 0,
        visibility: 'hidden',
        pointerEvents: 'none',
      }}
    />
  );
};
