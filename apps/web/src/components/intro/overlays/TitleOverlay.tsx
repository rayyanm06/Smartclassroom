import React, { useRef } from 'react';
import { useTrack } from '../engine/useTrack';
import { W, seg } from '../engine/timeline';

export const TitleOverlay: React.FC = () => {
  const introTitleRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const brainTitleRef = useRef<HTMLDivElement>(null);
  const visionTitleRef = useRef<HTMLDivElement>(null);

  useTrack((p) => {
    // 1. Scene 01: SMART CLASSROOM Title
    if (introTitleRef.current) {
      if (p <= 7.5) {
        introTitleRef.current.style.visibility = 'visible';
        const outT = seg(p, W.introTitleOut[0], W.introTitleOut[1]);
        const opacity = 1 - outT;
        const translateY = -outT * 60;
        introTitleRef.current.style.opacity = `${opacity}`;
        introTitleRef.current.style.transform = `translateY(${translateY}px)`;
      } else {
        introTitleRef.current.style.visibility = 'hidden';
      }
    }

    // Scroll Hint
    if (scrollHintRef.current) {
      if (p <= 2.5) {
        const hintOut = seg(p, W.introHintOut[0], W.introHintOut[1]);
        scrollHintRef.current.style.opacity = `${1 - hintOut}`;
      } else {
        scrollHintRef.current.style.opacity = '0';
      }
    }

    // 2. Scene 02: THE BRAIN Title (in 11.5 -> 13.5, out 19 -> 21)
    if (brainTitleRef.current) {
      if (p >= 11.0 && p <= 21.5) {
        brainTitleRef.current.style.visibility = 'visible';
        const inT = seg(p, W.brainTitleIn[0], W.brainTitleIn[1]);
        const outT = seg(p, W.brainTitleOut[0], W.brainTitleOut[1]);
        const opacity = inT * (1 - outT);
        const translateY = (1 - inT) * 40 - outT * 30;
        brainTitleRef.current.style.opacity = `${opacity}`;
        brainTitleRef.current.style.transform = `translateY(${translateY}px)`;
      } else {
        brainTitleRef.current.style.visibility = 'hidden';
      }
    }

    // 3. Scene 09: VISION LAYER Title (in 61.5 -> 63, out 69 -> 70.2)
    if (visionTitleRef.current) {
      if (p >= 61.0 && p <= 71.0) {
        visionTitleRef.current.style.visibility = 'visible';
        const inT = seg(p, W.visionTitleIn[0], W.visionTitleIn[1]);
        const outT = seg(p, W.visionTitleOut[0], W.visionTitleOut[1]);
        const opacity = inT * (1 - outT);
        const translateY = (1 - inT) * 30 - outT * 30;
        visionTitleRef.current.style.opacity = `${opacity}`;
        visionTitleRef.current.style.transform = `translateY(${translateY}px)`;
      } else {
        visionTitleRef.current.style.visibility = 'hidden';
      }
    }
  });

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {/* 1. Scene 01 Big Title */}
      <div
        ref={introTitleRef}
        className="absolute top-[28%] left-[6vw] max-w-3xl flex flex-col gap-2"
      >
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-0.5 bg-[#FFD83D] border-2 border-[#111111] font-mono text-xs font-bold uppercase tracking-wider">
            SPIT ROOM 508
          </span>
          <span className="font-mono text-xs font-bold text-neutral-600 uppercase tracking-widest">
            SYSTEM ARCHITECTURE
          </span>
        </div>
        <h1 className="lp-display-font text-[var(--lp-display-xl)] text-[#111111] leading-none m-0">
          SMART<br />CLASSROOM
        </h1>
        <p className="font-mono text-xs sm:text-sm font-bold tracking-[0.18em] text-[#111111] uppercase mt-2">
          OCCUPANCY · ENVIRONMENT · ENERGY
        </p>
      </div>

      {/* Scroll Down Hint */}
      <div
        ref={scrollHintRef}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 font-mono text-xs font-bold text-[#111111] tracking-wider"
      >
        <span className="bg-[#F4F0E6] px-3 py-1 border-2 border-[#111111] shadow-[3px_3px_0_#111111]">
          SCROLL TO BUILD THE CLASSROOM
        </span>
        <span className="lp-scroll-hint-bob text-lg">↓</span>
      </div>

      {/* 2. Scene 02 THE BRAIN Title */}
      <div
        ref={brainTitleRef}
        className="absolute top-[16%] left-[6vw] flex flex-col gap-1"
        style={{ visibility: 'hidden' }}
      >
        <span className="px-2 py-0.5 bg-[#FFD83D] border-2 border-[#111111] font-mono text-xs font-bold w-fit">
          CORE 01 · HARDWARE
        </span>
        <h2 className="lp-display-font text-[var(--lp-display-l)] text-[#111111] leading-none m-0">
          THE BRAIN
        </h2>
        <p className="font-mono text-xs sm:text-sm font-bold text-[#111111] tracking-wider uppercase">
          ESP32 DUAL-CORE MICROCONTROLLER
        </p>
      </div>

      {/* 3. Scene 09 VISION LAYER Title */}
      <div
        ref={visionTitleRef}
        className="absolute top-[16%] left-[6vw] flex flex-col gap-1"
        style={{ visibility: 'hidden' }}
      >
        <span className="px-2 py-0.5 bg-[#27C7E8] border-2 border-[#111111] font-mono text-xs font-bold w-fit">
          CORE 02 · OPTICAL SENSING
        </span>
        <h2 className="lp-display-font text-[var(--lp-display-l)] text-[#111111] leading-none m-0">
          VISION LAYER
        </h2>
        <p className="font-mono text-xs sm:text-sm font-bold text-[#111111] tracking-wider uppercase">
          REAL IPHONE RTSP · OPENCV · YOLO11n
        </p>
      </div>
    </div>
  );
};
