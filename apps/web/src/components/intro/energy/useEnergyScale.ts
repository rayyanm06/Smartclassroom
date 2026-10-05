import { useEffect } from 'react';
import type { RefObject } from 'react';

export function useEnergyScale(svgRef: RefObject<SVGSVGElement | null>): void {
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const apply = (): void => {
      const vb = svg.viewBox.baseVal;
      const w = svg.getBoundingClientRect().width;
      if (w > 0 && vb.width > 0) svg.style.setProperty('--u', (vb.width / w).toFixed(4));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(svg);
    return () => ro.disconnect();
  }, [svgRef]);
}
