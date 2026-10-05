import React, { useRef } from 'react';
import { useTrack } from '../engine/useTrack';
import { W, seg } from '../engine/timeline';

export const Backgrounds: React.FC = () => {
  const redBgRef = useRef<HTMLDivElement>(null);
  const darkBgRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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

    // 3. Grid parallax shift (a subtle -0.06 factor)
    if (gridRef.current) {
      const shiftY = (p * 4) % 48;
      gridRef.current.style.transform = `translateY(${shiftY}px)`;
    }
  });

  return (
    <>
      {/* 1. Base Engineering Paper Background */}
      <div className="lp-bg-layer lp-bg-paper" />

      {/* 2. Red Cut Background for 404 Glitch Scene */}
      <div ref={redBgRef} className="lp-bg-layer lp-bg-red" />

      {/* 3. Dark Background for System Reboot Scene */}
      <div ref={darkBgRef} className="lp-bg-layer lp-bg-dark" />

      {/* 4. Technical Blueprint Grid */}
      <div ref={gridRef} className="lp-grid" />

      {/* 5. Physical Paper Grain Tile */}
      <div className="lp-grain" />

      {/* 6. Four Corner Technical Registration Marks */}
      <svg className="lp-reg-mark lp-reg-tl" viewBox="0 0 24 24">
        <path d="M12 2 V22 M2 12 H22" stroke="#111111" strokeWidth={2} />
      </svg>
      <svg className="lp-reg-mark lp-reg-tr" viewBox="0 0 24 24">
        <path d="M12 2 V22 M2 12 H22" stroke="#111111" strokeWidth={2} />
      </svg>
      <svg className="lp-reg-mark lp-reg-bl" viewBox="0 0 24 24">
        <path d="M12 2 V22 M2 12 H22" stroke="#111111" strokeWidth={2} />
      </svg>
      <svg className="lp-reg-mark lp-reg-br" viewBox="0 0 24 24">
        <path d="M12 2 V22 M2 12 H22" stroke="#111111" strokeWidth={2} />
      </svg>
    </>
  );
};
