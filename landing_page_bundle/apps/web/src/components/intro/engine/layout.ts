import { useState, useEffect } from 'react';
import type { LayoutMode } from './types';

export const LANDSCAPE_ANCHORS = {
  esp32: { x: 1200, y: 600 },
  pir: { x: 700, y: 600 },
  dht: { x: 1700, y: 600 },
  relay1: { x: 700, y: 1060 },
  relay2: { x: 1700, y: 1060 },
  light: { x: 400, y: 1360 },
  ac: { x: 2000, y: 1380 },
  phone: { x: 2440, y: 760 },
  frame: { x: 2900, y: 620 },
  monitor: { x: 1200, y: 1900 },
  chipsRow: { y: 960, xs: [2660, 2820, 2980, 3140] },
} as const;

export const PORTRAIT_ANCHORS = {
  esp32: { x: 450, y: 900 },
  pir: { x: 450, y: 470 },
  dht: { x: 450, y: 1330 },
  relay1: { x: 240, y: 1900 },
  relay2: { x: 660, y: 1900 },
  light: { x: 240, y: 2380 },
  ac: { x: 660, y: 2380 },
  phone: { x: 140, y: 3000 },
  frame: { x: 590, y: 2980 },
  monitor: { x: 450, y: 3990 },
  chipsRow: { y: 3240, xs: [145, 335, 525, 715] },
} as const;

export function useLayout(): LayoutMode {
  const [layout, setLayout] = useState<LayoutMode>(() => {
    if (typeof window === 'undefined') return 'LANDSCAPE';
    const mq = window.matchMedia('(max-aspect-ratio: 1/1), (max-width: 720px)');
    return mq.matches ? 'PORTRAIT' : 'LANDSCAPE';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-aspect-ratio: 1/1), (max-width: 720px)');
    const onChange = (e: MediaQueryListEvent) => {
      setLayout(e.matches ? 'PORTRAIT' : 'LANDSCAPE');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return layout;
}
