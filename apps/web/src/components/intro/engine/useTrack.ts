import { useEffect, useContext, useRef } from 'react';
import { StageContext } from './StageContext';
import type { TrackFn } from './types';

export function useTrack(trackFn: TrackFn): void {
  const stage = useContext(StageContext);
  const trackRef = useRef(trackFn);

  useEffect(() => {
    trackRef.current = trackFn;
  });

  useEffect(() => {
    if (!stage) return;
    const fn: TrackFn = (p, ctx) => {
      trackRef.current(p, ctx);
    };
    return stage.registerTrack(fn);
  }, [stage]);
}
