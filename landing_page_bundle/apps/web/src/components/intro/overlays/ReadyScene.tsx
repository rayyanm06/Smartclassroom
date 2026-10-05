import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrack } from '../engine/useTrack';
import { seg } from '../engine/timeline';
import { BrutalistButton } from './BrutalistButton';
import { runDashboardTransition } from '../transition/dashboardTransition';

export function ReadyScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useTrack((p: number) => {
    if (!containerRef.current || !cardRef.current) return;

    if (p < 94.2) {
      containerRef.current.style.opacity = '0';
      containerRef.current.style.pointerEvents = 'none';
      return;
    }

    const reveal = seg(p, 94.5, 96.5);
    containerRef.current.style.opacity = reveal.toFixed(3);
    containerRef.current.style.pointerEvents = reveal > 0.5 ? 'auto' : 'none';

    // Slide up effect
    const yOffset = (1 - reveal) * 40;
    cardRef.current.style.transform = `translateY(${yOffset.toFixed(1)}px)`;
  });

  const handleLaunch = () => {
    runDashboardTransition(navigate);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-28 flex items-center justify-center p-4 sm:p-8 select-none transition-opacity duration-75"
      style={{ opacity: 0, pointerEvents: 'none' }}
      aria-label="Launch call to action"
    >
      <div
        ref={cardRef}
        className="w-full max-w-xl lp-card bg-white p-6 sm:p-10 flex flex-col items-center text-center gap-6 shadow-2xl transition-transform ease-out"
      >
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 border-2 border-[var(--lp-ink)] font-mono text-xs font-black tracking-widest text-amber-900 rounded">
          <span>●</span> CLIMAX SEQUENCE · PHASE 14
        </div>

        {/* Big brutalist typography */}
        <div className="flex flex-col items-center leading-[0.88] select-none font-black">
          <span className="text-4xl sm:text-6xl md:text-7xl tracking-tighter text-[var(--lp-ink)]">
            ARE
          </span>
          <span className="text-4xl sm:text-6xl md:text-7xl tracking-tighter text-[var(--lp-ink)]">
            YOU
          </span>
          <span className="text-5xl sm:text-7xl md:text-8xl tracking-tight text-[var(--lp-yellow-dim)] -mt-1 sm:-mt-2">
            READY?
          </span>
        </div>

        <p className="font-mono text-xs sm:text-sm text-stone-600 max-w-md leading-relaxed">
          The autonomous smart classroom engine is loaded. Real-time vision, sensor simulation,
          and automated appliance relay orchestration are ready.
        </p>

        {/* Big Yellow CTA Button */}
        <div className="w-full flex flex-col items-center gap-3 pt-2">
          <BrutalistButton
            variant="primary"
            size="lg"
            onClick={handleLaunch}
            className="w-full max-w-md text-base sm:text-lg font-black tracking-widest"
          >
            INITIALIZE DASHBOARD →
          </BrutalistButton>

          <span className="font-mono text-[10px] text-stone-400 uppercase tracking-widest">
            NAVGATION TARGET: / (MAIN CONTROL CENTER)
          </span>
        </div>

        {/* Subsystem badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full pt-4 border-t-2 border-stone-200 font-mono text-[10px] text-stone-600 font-bold">
          <div className="p-1.5 bg-stone-50 border border-stone-300 rounded">ESP32 TARGET</div>
          <div className="p-1.5 bg-stone-50 border border-stone-300 rounded">YOLO11n ONNX</div>
          <div className="p-1.5 bg-stone-50 border border-stone-300 rounded">RTSP 554</div>
          <div className="p-1.5 bg-stone-50 border border-stone-300 rounded">FASTAPI 8000</div>
        </div>
      </div>
    </div>
  );
}
