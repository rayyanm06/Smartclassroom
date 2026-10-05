import { useEffect, useState } from 'react';
import { StageProvider } from './engine/StageProvider';
import { Backgrounds } from './overlays/Backgrounds';
import { IntroWorld } from './world/IntroWorld';
import { TitleOverlay } from './overlays/TitleOverlay';
import { BootScene } from './overlays/BootScene';
import { ReadyScene } from './overlays/ReadyScene';
import { HudStrip } from './overlays/HudStrip';
import { SceneProgress } from './overlays/SceneProgress';
import { SkipIntro } from './overlays/SkipIntro';
import { DebugOverlay } from './overlays/DebugOverlay';
import { StaticStoryboard } from './static/StaticStoryboard';
import { DarkPanel } from './energy/DarkPanel';
import { EnergyFlash } from './energy/EnergyFlash';
import { T } from './energy/energyTimeline';
import './intro.css';
import './energy/energy.css';

export function IntroRoot() {
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    // Listen for preference changes
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Add lp-active and landing-active classes to html root
    document.documentElement.classList.add('lp-active', 'landing-active');
    return () => {
      document.documentElement.classList.remove('lp-active', 'landing-active');
    };
  }, []);

  if (reducedMotion) {
    return <StaticStoryboard />;
  }

  const handleDarkLevel = (o: number) => {
    const hwNodes = document.querySelectorAll('.lp-world-svg #scene-02-esp32, .lp-world-svg #scene-03-04-sensors, .lp-world-svg #scene-07-relays');
    hwNodes.forEach((node) => {
      if (o >= 0.4) {
        node.classList.add('e-sticker');
      } else {
        node.classList.remove('e-sticker');
      }
    });
  };

  return (
    <div className="lp-root landing-root relative w-full antialiased selection:bg-[var(--lp-yellow)] selection:text-black">
      <StageProvider>
        {/* Paper / Red / Dark backgrounds + Grid parallax */}
        <Backgrounds />

        {/* Dark Panels Layer (z-index: 1 inside Stage) */}
        {/* Dark Panel A (p 0.340 - 0.606) */}
        <DarkPanel
          rect={{ left: '6%', top: '10%', width: '88%', height: '80%' }}
          polygon="polygon(2% 14%, 14% 6%, 30% 11%, 47% 3%, 66% 9%, 84% 4%, 98% 15%, 95% 36%, 99% 58%, 94% 82%, 80% 97%, 60% 91%, 42% 98%, 24% 92%, 8% 97%, 3% 72%, 6% 44%)"
          level={0.8}
          win={T.panelA}
          onLevel={handleDarkLevel}
        />

        {/* Dark Panel C - Camera / Machine-Vision Environment (p 0.596 - 0.772) */}
        <DarkPanel
          rect={{ left: '10%', top: '5%', width: '85%', height: '90%' }}
          polygon="polygon(6% 0, 100% 0, 100% 100%, 0 100%, 4% 82%, 0 62%, 5% 44%, 1% 24%)"
          level={0.97}
          win={T.panelCam}
        />

        {/* Dark Panel S - Electrical Storm Full-Stage Contrast (p 0.690 - 0.840) */}
        <DarkPanel
          rect={{ left: '0%', top: '0%', width: '100%', height: '100%' }}
          polygon="polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"
          level={0.94}
          win={T.panelStorm}
        />

        {/* Core SVG World containing all animated hardware scenes (z-index: 2-3) */}
        <IntroWorld />

        {/* Storm Flash Overlay (z-index: 4, capped at 0.28) */}
        <EnergyFlash />

        {/* Typography chapter overlays (Room, ESP32, Vision) */}
        <TitleOverlay />

        {/* Theatrical VT100 Boot Terminal (Scene 13) */}
        <BootScene />

        {/* ARE YOU READY? & Launch CTA (Scene 14) */}
        <ReadyScene />

        {/* Top HUD plate & telemetry badges */}
        <HudStrip />

        {/* Vertical chapter jump ticks */}
        <SceneProgress />

        {/* Top-right skip button */}
        <SkipIntro />

        {/* Developer debug panel for ?debug=1 */}
        <DebugOverlay />
      </StageProvider>
    </div>
  );
}
