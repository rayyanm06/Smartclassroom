import { useRef, useEffect } from 'react';
import { energyProgress } from '../energy/energyProgress';

export function SceneProgress() {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return energyProgress.subscribe((p) => {
      if (!fillRef.current) return;
      // p in 0..1
      fillRef.current.style.transform = `scaleY(${p})`;

      // Switch to yellow fill during dark panels (panelA: 0.34-0.606, panelCam: 0.596-0.772, panelStorm: 0.69-0.84)
      const isDark = (p >= 0.35 && p <= 0.60) || (p >= 0.60 && p <= 0.84);
      fillRef.current.style.backgroundColor = isDark ? '#FFD83D' : '#111111';
    });
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        right: '6px',
        top: '12vh',
        height: '76vh',
        width: '3px',
        background: 'rgba(17, 17, 17, 0.15)',
        zIndex: 40,
        pointerEvents: 'none',
      }}
    >
      <div
        ref={fillRef}
        style={{
          width: '100%',
          height: '100%',
          background: '#111111',
          transformOrigin: 'top',
          transform: 'scaleY(0)',
          transition: 'background-color 0.2s linear',
        }}
      />
    </div>
  );
}

