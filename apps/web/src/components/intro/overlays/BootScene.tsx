import { useRef } from 'react';
import { useTrack } from '../engine/useTrack';
import { seg } from '../engine/timeline';

const BOOT_LINES = [
  { text: 'SYSTEM REBOOT SEQUENCE INITIATED...', color: 'text-stone-400', p: [90.8, 91.2] as const },
  { text: '[OK] ESP32 MICROCONTROLLER : TARGET HARDWARE MOUNTED', color: 'text-amber-400', p: [91.2, 91.6] as const },
  { text: '[OK] PIR MOTION SENSOR     : SIMULATION PROTOCOL VERIFIED', color: 'text-cyan-300', p: [91.6, 92.0] as const },
  { text: '[OK] DHT11 TEMP / HUMIDITY : SIMULATION STREAM ONLINE', color: 'text-cyan-300', p: [92.0, 92.4] as const },
  { text: '[OK] DUAL RELAY CHANNELS   : 2x 10A SWITCHING MATRIX READY', color: 'text-amber-400', p: [92.4, 92.8] as const },
  { text: '[OK] RTSP INGEST PIPELINE  : 172.20.10.1:554/stream ONLINE', color: 'text-emerald-400', p: [92.8, 93.2] as const },
  { text: '[OK] YOLO11n NEURAL ENGINE : ONNX / OPENCV ACCELERATOR LOADED', color: 'text-emerald-400', p: [93.2, 93.6] as const },
  { text: '[OK] FASTAPI / MYSQL HOST  : PORT 8000 & 3306 OPERATIONAL', color: 'text-emerald-400', p: [93.6, 94.0] as const },
  { text: '>>> ALL SUBSYSTEMS NOMINAL · PLATFORM READY FOR HANDOFF', color: 'text-[var(--lp-yellow)] font-black', p: [94.0, 94.5] as const },
];

export function BootScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useTrack((p: number) => {
    if (!containerRef.current) return;

    // Visible between 90.5 and 95.5
    if (p < 90.5 || p > 95.8) {
      containerRef.current.style.opacity = '0';
      containerRef.current.style.pointerEvents = 'none';
      return;
    }

    const fadeIn = seg(p, 90.5, 91.0);
    const fadeOut = 1 - seg(p, 95.0, 95.6);
    const opacity = Math.min(fadeIn, fadeOut);

    containerRef.current.style.opacity = opacity.toFixed(3);
    containerRef.current.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';

    // Reveal lines based on progress
    BOOT_LINES.forEach((line, idx) => {
      const el = lineRefs.current[idx];
      if (!el) return;
      const reveal = seg(p, line.p[0], line.p[1]);
      el.style.opacity = reveal > 0 ? (reveal >= 1 ? '1' : reveal.toFixed(2)) : '0';
      el.style.transform = `translateX(${((1 - reveal) * 12).toFixed(1)}px)`;
    });
  });

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-25 flex items-center justify-center p-4 sm:p-8 bg-black/85 backdrop-blur-xs select-none transition-opacity duration-75"
      style={{ opacity: 0, pointerEvents: 'none' }}
      aria-label="System boot console"
    >
      <div className="w-full max-w-3xl lp-card bg-[#0e1117] text-white border-2 border-stone-700 shadow-2xl overflow-hidden font-mono">
        {/* Terminal Header */}
        <div className="bg-stone-900 border-b border-stone-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span className="ml-2 text-xs font-bold tracking-wider text-stone-300">
              SMART-CLASSROOM · VT100 RECOVERY BOOT
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-amber-400 bg-amber-950/80 px-2 py-0.5 border border-amber-800 rounded">
            DEMO SEQUENCE · NOT LIVE STATUS
          </span>
        </div>

        {/* Terminal Body */}
        <div className="p-5 sm:p-6 space-y-2 text-xs sm:text-sm min-h-[280px]">
          {BOOT_LINES.map((line, idx) => (
            <p
              key={idx}
              ref={(el) => {
                lineRefs.current[idx] = el;
              }}
              className={`${line.color} transition-transform ease-out`}
              style={{ opacity: 0 }}
            >
              {line.text}
            </p>
          ))}
          <div className="pt-3 flex items-center gap-1.5 text-stone-500 text-xs">
            <span>root@smart-classroom:~#</span>
            <span className="w-2.5 h-4 bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
