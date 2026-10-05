import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { TrackFn, TrackContext, StageContextValue } from './types';
import { useLayout } from './layout';
import { StageContext } from './StageContext';
import { getChapterByProgress } from './timeline';

interface StageProviderProps {
  children: React.ReactNode;
  frozenP?: number;
  isReducedMotion?: boolean;
}

function getActiveChapter(p: number): string {
  return getChapterByProgress(p).key;
}

export const StageProvider: React.FC<StageProviderProps> = ({
  children,
  frozenP,
  isReducedMotion = false,
}) => {
  const layout = useLayout();
  const tracksRef = useRef<Set<TrackFn>>(new Set());
  const trackContainerRef = useRef<HTMLDivElement>(null);

  // Parse ?p=NN freeze from URL if frozenP not passed directly
  const effectiveFrozenP = useMemo(() => {
    if (frozenP !== undefined) return frozenP;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pParam = params.get('p');
      if (pParam !== null) {
        const val = parseFloat(pParam);
        if (!isNaN(val)) return Math.max(0, Math.min(100, val));
      }
    }
    return undefined;
  }, [frozenP]);

  const displayPRef = useRef<number>(effectiveFrozenP ?? 0);
  const targetPRef = useRef<number>(effectiveFrozenP ?? 0);
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const [currentProgress, setCurrentProgress] = useState<number>(() => effectiveFrozenP ?? 0);

  const runTracks = useCallback((p: number) => {
    const ctx: TrackContext = {
      progress: p,
      targetProgress: targetPRef.current,
      chapter: getActiveChapter(p),
      layout,
      isReducedMotion,
      isFrozen: effectiveFrozenP !== undefined,
    };
    tracksRef.current.forEach((fn) => {
      try {
        fn(p, ctx);
      } catch {
        // Prevent rogue track crash from breaking loop
      }
    });
  }, [layout, isReducedMotion, effectiveFrozenP]);

  const registerTrack = useCallback((fn: TrackFn) => {
    tracksRef.current.add(fn);
    // Execute immediately with current progress
    fn(displayPRef.current, {
      progress: displayPRef.current,
      targetProgress: targetPRef.current,
      chapter: getActiveChapter(displayPRef.current),
      layout,
      isReducedMotion,
      isFrozen: effectiveFrozenP !== undefined,
    });
    return () => {
      tracksRef.current.delete(fn);
    };
  }, [layout, isReducedMotion, effectiveFrozenP]);

  const updateLoopRef = useRef<(timestamp: number) => void>(() => {});

  const updateLoop = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = timestamp;

    const target = targetPRef.current;
    let current = displayPRef.current;

    // Damping tau (0.09s desktop, 0.06s touch)
    const tau = layout === 'PORTRAIT' ? 0.06 : 0.09;
    let nextP = current + (target - current) * (1 - Math.exp(-dt / tau));

    // Slew limit in glitch window [87, 90.5] cap at 5% / sec (§4.2, §15)
    if (current >= 87 && current <= 90.5) {
      const maxDelta = 5.0 * dt;
      if (Math.abs(nextP - current) > maxDelta) {
        nextP = current + Math.sign(nextP - current) * maxDelta;
      }
    }

    if (Math.abs(target - nextP) < 0.002) {
      nextP = target;
      displayPRef.current = nextP;
      runTracks(nextP);
      setCurrentProgress(nextP);
      rafIdRef.current = null;
      lastTimeRef.current = 0;
      return;
    }

    displayPRef.current = nextP;
    runTracks(nextP);
    setCurrentProgress(nextP);

    rafIdRef.current = requestAnimationFrame((t) => {
      updateLoopRef.current(t);
    });
  }, [layout, runTracks]);

  useEffect(() => {
    updateLoopRef.current = updateLoop;
  }, [updateLoop]);

  const computeScrollProgress = useCallback((): number => {
    if (typeof window === 'undefined') return 0;
    const scrollY = window.scrollY || window.pageYOffset;
    const trackEl = trackContainerRef.current;
    if (!trackEl) return 0;

    const trackTop = trackEl.offsetTop;
    const trackHeight = trackEl.offsetHeight;
    const viewportHeight = window.innerHeight;
    const scrollable = trackHeight - viewportHeight;

    if (scrollable <= 0) return 0;
    const p = ((scrollY - trackTop) / scrollable) * 100;
    return Math.max(0, Math.min(100, p));
  }, []);

  const onScroll = useCallback(() => {
    if (effectiveFrozenP !== undefined) return;
    const p = computeScrollProgress();
    targetPRef.current = p;

    if (rafIdRef.current === null) {
      lastTimeRef.current = 0;
      rafIdRef.current = requestAnimationFrame((t) => {
        updateLoopRef.current(t);
      });
    }
  }, [computeScrollProgress, effectiveFrozenP]);

  const scrollToProgress = useCallback((p: number, instant = false) => {
    if (typeof window === 'undefined') return;
    const trackEl = trackContainerRef.current;
    if (!trackEl) return;

    const trackTop = trackEl.offsetTop;
    const trackHeight = trackEl.offsetHeight;
    const viewportHeight = window.innerHeight;
    const scrollable = trackHeight - viewportHeight;

    const targetScrollY = trackTop + (Math.max(0, Math.min(100, p)) / 100) * scrollable;
    window.scrollTo({
      top: targetScrollY,
      behavior: instant || isReducedMotion ? 'auto' : 'smooth',
    });
  }, [isReducedMotion]);

  useEffect(() => {
    if (effectiveFrozenP !== undefined) {
      displayPRef.current = effectiveFrozenP;
      targetPRef.current = effectiveFrozenP;
      runTracks(effectiveFrozenP);
      return;
    }

    // Initial frame sync (handles back-button or mid-page reload)
    const initialP = computeScrollProgress();
    displayPRef.current = initialP;
    targetPRef.current = initialP;
    runTracks(initialP);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [computeScrollProgress, effectiveFrozenP, onScroll, runTracks]);

  const contextValue = useMemo<StageContextValue>(() => ({
    registerTrack,
    progress: currentProgress,
    layout,
    isReducedMotion,
    scrollToProgress,
  }), [registerTrack, currentProgress, layout, isReducedMotion, scrollToProgress]);

  // Non-negotiable correction 1:
  // Desktop track: 1500vh
  // Mobile/portrait track: 1250dvh
  const trackStyle = useMemo<React.CSSProperties>(() => {
    if (effectiveFrozenP !== undefined || isReducedMotion) {
      return { height: '100dvh', overflow: 'hidden' };
    }
    return {
      height: layout === 'PORTRAIT' ? '1250dvh' : '1500vh',
      position: 'relative',
    };
  }, [layout, effectiveFrozenP, isReducedMotion]);

  return (
    <StageContext.Provider value={contextValue}>
      <div ref={trackContainerRef} className="lp-track" style={trackStyle}>
        <div className="lp-stage">{children}</div>
      </div>
    </StageContext.Provider>
  );
};
