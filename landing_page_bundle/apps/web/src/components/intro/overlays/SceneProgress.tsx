import { useRef } from 'react';
import { CH } from '../engine/timeline';
import { useTrack } from '../engine/useTrack';

const CHAPTERS = CH.map((ch) => ({
  id: ch.sceneNum,
  name: ch.name.split(' ')[0],
  p: ch.start,
}));

export function SceneProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const tickRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useTrack((p: number) => {
    if (barRef.current) {
      barRef.current.style.height = `${p}%`;
    }

    CHAPTERS.forEach((ch, idx) => {
      const el = tickRefs.current[idx];
      if (!el) return;
      const nextP = CHAPTERS[idx + 1]?.p ?? 100;
      const isActive = p >= ch.p && p < nextP;
      if (isActive) {
        el.setAttribute('data-active', 'true');
      } else {
        el.removeAttribute('data-active');
      }
    });
  });

  const jumpTo = (targetP: number) => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetY = (targetP / 100) * docHeight;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  return (
    <nav
      className="fixed right-3 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col items-end gap-1 pointer-events-auto select-none"
      aria-label="Scene progression index"
    >
      <div className="relative flex flex-col gap-2 py-3 px-2 lp-plate bg-white/95">
        {/* Fill bar */}
        <div className="absolute right-2 top-3 bottom-3 w-1 bg-stone-200 rounded-full overflow-hidden">
          <div
            ref={barRef}
            className="w-full bg-[var(--lp-ink)] transition-[height] duration-75 ease-linear"
            style={{ height: '0%' }}
          />
        </div>

        {/* Chapter tick buttons */}
        <div className="flex flex-col gap-1.5 pr-3">
          {CHAPTERS.map((ch, idx) => (
            <button
              key={ch.id}
              ref={(el) => {
                tickRefs.current[idx] = el;
              }}
              type="button"
              onClick={() => jumpTo(ch.p)}
              className="group flex items-center justify-end gap-2 text-[10px] font-mono font-bold text-stone-400 hover:text-[var(--lp-ink)] transition-colors cursor-pointer data-[active=true]:text-[var(--lp-ink)] data-[active=true]:font-black"
              title={`Jump to Scene ${ch.id}: ${ch.name} (${ch.p}%)`}
            >
              <span className="opacity-0 group-hover:opacity-100 group-data-[active=true]:opacity-100 transition-opacity uppercase tracking-wider text-[9px] bg-white px-1 border border-stone-300 rounded shadow-xs">
                {ch.id} {ch.name}
              </span>
              <span className="w-2 h-2 rounded-full border border-stone-800 bg-white group-data-[active=true]:bg-[var(--lp-yellow)] group-hover:scale-125 transition-transform" />
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
