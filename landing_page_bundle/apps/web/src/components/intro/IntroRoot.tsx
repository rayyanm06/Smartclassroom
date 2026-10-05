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
import './intro.css';

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
    // Add lp-active class to html root
    document.documentElement.classList.add('lp-active');
    return () => {
      document.documentElement.classList.remove('lp-active');
    };
  }, []);

  if (reducedMotion) {
    return <StaticStoryboard />;
  }

  return (
    <div className="lp-root relative w-full antialiased selection:bg-[var(--lp-yellow)] selection:text-black">
      <StageProvider>
        {/* Paper / Red / Dark backgrounds + Grid parallax */}
        <Backgrounds />

        {/* Core SVG World containing all 11 animated hardware scenes */}
        <IntroWorld />

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
