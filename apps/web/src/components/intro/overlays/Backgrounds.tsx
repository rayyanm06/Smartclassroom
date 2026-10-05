import React, { useRef } from 'react';
import { useTrack } from '../engine/useTrack';
import { W, seg } from '../engine/timeline';
import { BlueprintBackground } from '../energy/BlueprintBackground';

export const Backgrounds: React.FC = () => {
  const redBgRef = useRef<HTMLDivElement>(null);
  const darkBgRef = useRef<HTMLDivElement>(null);

  useTrack((p) => {
    // 1. Red background cut for 404 (87.9 -> 88.05 in, 90.0 out)
    if (redBgRef.current) {
      if (p >= W.redCut[0] && p < W.darkCut[0]) {
        const redIn = seg(p, W.redCut[0], W.redCut[1]);
        redBgRef.current.style.opacity = `${redIn}`;
      } else {
        redBgRef.current.style.opacity = '0';
      }
    }

    // 2. Dark background for Reboot (90.0 -> 90.4 in, 96.0 -> 96.6 out)
    if (darkBgRef.current) {
      if (p >= W.darkCut[0] && p < W.paperReturn[1]) {
        const darkIn = seg(p, W.darkCut[0], W.darkCut[1]);
        const darkOut = seg(p, W.paperReturn[0], W.paperReturn[1]);
        darkBgRef.current.style.opacity = `${darkIn * (1 - darkOut)}`;
      } else {
        darkBgRef.current.style.opacity = '0';
      }
    }
  });

  return (
    <>
      {/* 1. Base Blueprint Drafting Paper Background (§5.1) */}
      <BlueprintBackground />

      {/* 2. Red Cut Background for 404 Glitch Scene */}
      <div ref={redBgRef} className="lp-bg-layer lp-bg-red" style={{ zIndex: 1 }} />

      {/* 3. Dark Background for System Reboot Scene */}
      <div ref={darkBgRef} className="lp-bg-layer lp-bg-dark" style={{ zIndex: 1 }} />
    </>
  );
};
