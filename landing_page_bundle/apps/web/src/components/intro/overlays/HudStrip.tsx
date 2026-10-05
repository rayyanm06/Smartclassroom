import { useRef } from 'react';
import { useTrack } from '../engine/useTrack';

export function HudStrip() {
  const statusRef = useRef<HTMLSpanElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const pRef = useRef<HTMLSpanElement>(null);

  useTrack((p: number) => {

    if (pRef.current) {
      pRef.current.textContent = `${p.toFixed(1)}%`;
    }

    if (!statusRef.current || !indicatorRef.current) return;

    let statusText = 'OFFLINE';
    let statusClass = 'text-[var(--lp-dim)]';
    let dotClass = 'bg-stone-400';

    if (p < 8) {
      statusText = 'OFFLINE';
      statusClass = 'text-stone-500';
      dotClass = 'bg-stone-400';
    } else if (p < 18) {
      statusText = 'ESP32 BOOTING';
      statusClass = 'text-[var(--lp-yellow-dim)]';
      dotClass = 'bg-[var(--lp-yellow)] animate-pulse';
    } else if (p < 45) {
      statusText = 'SENSORS ONLINE [SIM]';
      statusClass = 'text-[var(--lp-cyan-dim)]';
      dotClass = 'bg-[var(--lp-cyan)]';
    } else if (p < 68) {
      statusText = 'VISION PIPELINE ONLINE';
      statusClass = 'text-[var(--lp-cyan-dim)]';
      dotClass = 'bg-[var(--lp-cyan)]';
    } else if (p < 85) {
      statusText = 'HOST TELEMETRY STREAM';
      statusClass = 'text-[var(--lp-ink)]';
      dotClass = 'bg-[var(--lp-yellow)]';
    } else if (p < 87) {
      statusText = 'TERMINAL CONNECTING';
      statusClass = 'text-[var(--lp-ink)]';
      dotClass = 'bg-[var(--lp-yellow)]';
    } else if (p < 91) {
      statusText = 'LINK LOST [ERR 404]';
      statusClass = 'text-[var(--lp-red)] font-black';
      dotClass = 'bg-[var(--lp-red)] animate-ping';
    } else if (p < 95) {
      statusText = 'SYSTEM REBOOTING';
      statusClass = 'text-[var(--lp-cyan)]';
      dotClass = 'bg-[var(--lp-cyan)] animate-pulse';
    } else {
      statusText = 'ARCHITECTURE READY';
      statusClass = 'text-[var(--lp-green)] font-bold';
      dotClass = 'bg-[var(--lp-green)]';
    }

    statusRef.current.textContent = statusText;
    statusRef.current.className = `font-mono text-xs uppercase tracking-wider ${statusClass}`;
    indicatorRef.current.className = `inline-block w-2.5 h-2.5 rounded-full ${dotClass}`;
  });

  return (
    <>
      {/* Top HUD plate */}
      <header
        className="fixed top-3 left-3 right-3 z-30 pointer-events-none flex items-center justify-between gap-2"
        aria-label="System telemetry HUD"
      >
        <div className="lp-plate px-3 py-1.5 flex items-center gap-2 pointer-events-auto shadow-sm max-w-[85vw] sm:max-w-none">
          <span ref={indicatorRef} className="inline-block w-2.5 h-2.5 rounded-full bg-stone-400" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 leading-tight">
            <span className="font-mono text-[10px] sm:text-xs font-black tracking-widest text-[var(--lp-ink)]">
              ROOM 508 · SYS ARCH
            </span>
            <span className="hidden sm:inline text-stone-300">|</span>
            <span ref={statusRef} className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-stone-500">
              OFFLINE
            </span>
          </div>
        </div>

        {/* Right honesty matrix */}
        <div className="hidden md:flex items-center gap-1.5 font-mono text-[9px] font-bold lp-plate px-2.5 py-1 text-stone-600 pointer-events-auto">
          <span className="px-1 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 rounded">ESP32: TARGET</span>
          <span className="px-1 py-0.5 bg-cyan-100 border border-cyan-300 text-cyan-900 rounded">SENSORS: SIM</span>
          <span className="px-1 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded">VISION: LIVE</span>
          <span className="px-1 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded">DB: LIVE</span>
          <span ref={pRef} className="ml-1 text-[var(--lp-ink)] font-black">
            0.0%
          </span>
        </div>
      </header>

      {/* Bottom-left honesty watermark */}
      <footer
        className="fixed bottom-3 left-3 z-30 pointer-events-none flex flex-col gap-1"
        aria-label="Simulation notice"
      >
        <div className="lp-plate px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-stone-600 bg-white/90 border border-stone-800">
          <span className="text-amber-600 mr-1.5">●</span>
          DEMO SEQUENCE · NOT LIVE STATUS
        </div>
      </footer>
    </>
  );
}
