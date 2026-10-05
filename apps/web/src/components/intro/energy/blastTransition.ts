import { buildBolt } from './lightningGeometry';
import { easeIn2, easeOut3, seg } from './energyMath';

const NS = 'http://www.w3.org/2000/svg';
const LAYERS = [
  { c: '#111111', w: 10 },
  { c: '#FF7A1A', w: 6 },
  { c: '#FFD83D', w: 3.2 },
  { c: '#FFFFFF', w: 1.4 },
];

export function triggerBlast(origin: DOMRect, onNavigate: () => void, stage: HTMLElement | null): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    onNavigate();
    return;
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cx = origin.left + origin.width / 2;
  const cy = origin.top + origin.height / 2;
  const R = Math.hypot(vw, vh);

  const root = document.createElement('div');
  root.setAttribute('aria-hidden', 'true');
  root.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;';

  const dark = document.createElement('div');
  dark.style.cssText = 'position:absolute;inset:0;background:#0B0B10;opacity:0;';

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
  svg.setAttribute('width', String(vw));
  svg.setAttribute('height', String(vh));
  svg.style.cssText = 'position:absolute;inset:0;';

  const flash = document.createElement('div');
  flash.style.cssText = 'position:absolute;inset:0;background:#FFF7C2;opacity:0;';

  root.append(dark, svg, flash);
  document.body.appendChild(root);
  document.documentElement.style.overflow = 'hidden';

  type B = { paths: SVGPathElement[]; start: number; end: number; len: number; branches: SVGPathElement[][] };
  const bolts: B[] = [];

  const make = (i: number, count: number, len: number, t0: number, t1: number): void => {
    const a = (i / count) * Math.PI * 2 + i * 0.37;
    const pts = Array.from({ length: 13 }, (_, k) => ({
      x: cx + Math.cos(a) * len * (k / 12),
      y: cy + Math.sin(a) * len * (k / 12),
    }));
    const g = buildBolt(pts, len, 900 + i * 17, 0.06, 4);

    const paths = LAYERS.map((L) => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', g.trunk);
      p.setAttribute('pathLength', '1');
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', L.c);
      p.setAttribute('stroke-width', String(L.w));
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
      p.style.strokeDasharray = '0 2';
      svg.appendChild(p);
      return p;
    });

    const branches = g.branches.map((b) =>
      LAYERS.slice(1).map((L, li) => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', b.d);
        p.setAttribute('pathLength', '1');
        p.setAttribute('fill', 'none');
        p.setAttribute('stroke', L.c);
        p.setAttribute('stroke-width', String(L.w * 0.5 + li * 0));
        p.setAttribute('stroke-linecap', 'round');
        p.style.strokeDasharray = '0 2';
        svg.appendChild(p);
        return p;
      })
    );

    bolts.push({ paths, start: t0, end: t1, len, branches });
  };

  for (let i = 0; i < 6; i++) make(i, 6, 60 + (i % 3) * 25, 0, 140);
  for (let i = 0; i < 12; i++) make(i + 6, 12, R * 0.6, 140, 460);

  const t0 = performance.now();
  let navigated = false;

  const tick = (now: number): void => {
    const t = now - t0;
    bolts.forEach((b) => {
      const e = easeOut3(seg(t, b.start, b.end));
      b.paths.forEach((p) => {
        p.style.strokeDasharray = `${e} 2`;
      });
      b.branches.forEach((bp) =>
        bp.forEach((p) => {
          p.style.strokeDasharray = `${seg(e, 0.3, 0.8)} 2`;
        })
      );
    });

    dark.style.opacity = String(0.85 * seg(t, 140, 300));
    if (stage) {
      const s = 1 + 0.9 * easeIn2(seg(t, 300, 560));
      stage.style.transformOrigin = `${cx}px ${cy}px`;
      stage.style.transform = `scale(${s})`;
    }

    const fl = t < 620 ? seg(t, 460, 540) : 1 - easeOut3(seg(t, 620, 900));
    flash.style.opacity = String(fl);
    svg.style.opacity = t < 620 ? '1' : String(1 - seg(t, 620, 760));

    if (!navigated && t >= 560) {
      navigated = true;
      onNavigate();
    }

    if (t < 920) {
      requestAnimationFrame(tick);
    } else {
      root.remove();
      document.documentElement.style.overflow = '';
    }
  };

  requestAnimationFrame(tick);
}
