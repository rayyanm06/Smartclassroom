import { useRef, useState } from 'react';
import { useTrack } from '../engine/useTrack';
import { CH } from '../engine/timeline';
import type { TrackContext } from '../engine/types';

const CHAPTER_LIST = Object.entries(CH).map(([key, val]) => ({
  key,
  name: val.name,
  start: val.start,
  end: val.end,
}));

export function DebugOverlay() {
  const [enabled] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1'
  );
  const [collapsed, setCollapsed] = useState(false);
  const progressTextRef = useRef<HTMLSpanElement>(null);
  const chapterTextRef = useRef<HTMLSpanElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const fpsRef = useRef<HTMLSpanElement>(null);

  const lastTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  useTrack((_p, ctx: TrackContext) => {
    if (!enabled) return;

    if (progressTextRef.current) {
      progressTextRef.current.textContent = `${ctx.progress.toFixed(2)}% (target: ${ctx.targetProgress.toFixed(2)}%)`;
    }

    if (chapterTextRef.current) {
      chapterTextRef.current.textContent = `${ctx.chapter} (${ctx.layout})`;
    }

    if (sliderRef.current && document.activeElement !== sliderRef.current) {
      sliderRef.current.value = ctx.progress.toString();
    }

    // Simple FPS calculation
    frameCountRef.current++;
    const now = performance.now();
    if (now - lastTimeRef.current >= 500) {
      const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
      if (fpsRef.current) {
        fpsRef.current.textContent = `${fps} FPS`;
      }
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
  });

  if (!enabled) return null;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: (val / 100) * docHeight });
  };

  const jumpTo = (pVal: number) => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: (pVal / 100) * docHeight, behavior: 'instant' });
  };

  return (
    <aside
      className="fixed bottom-3 right-3 z-50 font-mono text-xs select-none pointer-events-auto max-w-sm w-full"
      aria-label="Developer debug panel"
    >
      <div className="lp-plate bg-stone-900 text-stone-200 p-3 shadow-2xl border-2 border-stone-600">
        <div className="flex items-center justify-between pb-2 border-b border-stone-700">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-bold text-[var(--lp-yellow)]">LP DEBUG MATRIX</span>
          </div>
          <div className="flex items-center gap-2">
            <span ref={fpsRef} className="text-[10px] text-stone-400">
              60 FPS
            </span>
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="text-stone-400 hover:text-white px-1 font-bold cursor-pointer"
            >
              {collapsed ? '[+]' : '[-]'}
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="pt-2 space-y-2">
            <div>
              <div className="text-[10px] text-stone-400">PROGRESS:</div>
              <span ref={progressTextRef} className="font-bold text-white">
                0.00%
              </span>
            </div>

            <div>
              <div className="text-[10px] text-stone-400">ACTIVE CHAPTER:</div>
              <span ref={chapterTextRef} className="font-bold text-cyan-300">
                01_ROOM
              </span>
            </div>

            <div className="pt-1">
              <input
                ref={sliderRef}
                type="range"
                min="0"
                max="100"
                step="0.1"
                defaultValue="0"
                onChange={handleSliderChange}
                className="w-full accent-[var(--lp-yellow)] cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-4 gap-1 pt-1 max-h-24 overflow-y-auto pr-1">
              {CHAPTER_LIST.map((ch) => (
                <button
                  key={ch.key}
                  type="button"
                  onClick={() => jumpTo(ch.start)}
                  className="px-1 py-0.5 text-[9px] bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-700 truncate cursor-pointer text-center"
                  title={`${ch.name} (${ch.start}%)`}
                >
                  {ch.key.slice(0, 2)} {ch.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
