import React, { useRef, useState, useEffect } from 'react';
import { useTrack } from '../../engine/useTrack';
import { W, seg } from '../../engine/timeline';
import { outCubic } from '../../engine/easing';
import { Monitor } from '../hardware/Monitor';
import { ImpactBurst } from '../../energy/ImpactBurst';
import { T } from '../../energy/energyTimeline';
import { pulse, hash01 } from '../../energy/energyMath';
import { energyProgress } from '../../energy/energyProgress';

interface ComputerSceneProps {
  zoom?: number;
}

export const ComputerScene: React.FC<ComputerSceneProps> = ({ zoom: _zoom = 1 }) => {
  const groupRef = useRef<SVGGElement>(null);
  const flashRef = useRef<SVGRectElement>(null);
  const [monitorState, setMonitorState] = useState({
    mode: 'CHECKS' as 'CHECKS' | '404',
    checks: {
      sensors: false,
      esp32: false,
      camera: false,
      yolo: false,
      database: false,
    },
    crack: 0,
    glitchOffset: 0,
    scanlineY: 0,
    portsLit: {
      relay1: false,
      esp32: false,
      relay2: false,
      temp: false,
      hum: false,
      pir: false,
      yolo: false,
    },
  });

  useEffect(() => {
    return energyProgress.subscribe((p) => {
      // 1. Screen white flash rect during impact (§4.9.2)
      if (flashRef.current) {
        const fl = 0.9 * pulse(p, T.impact[0], T.impact[1]);
        flashRef.current.style.opacity = fl.toFixed(3);
      }
    });
  }, []);

  useTrack((p) => {
    // Monitor rises at 70.5 and remains visible through 92.4
    if (p < 70 || p > 92.4) {
      if (groupRef.current) groupRef.current.setAttribute('visibility', 'hidden');
      return;
    }
    if (groupRef.current) groupRef.current.setAttribute('visibility', 'visible');

    // 1. Monitor Rise (70.5 -> 73)
    let translateY = 0;
    if (p < W.monitorRise[0]) {
      translateY = 300;
    } else if (p < W.monitorRise[1]) {
      const t = seg(p, W.monitorRise[0], W.monitorRise[1], outCubic);
      translateY = 300 * (1 - t);
    } else {
      translateY = 0;
    }

    // Shake offset during 87.4 -> 89.5, plus jolt during impact (0.820 - 0.834, §4.9.3)
    let shakeX = 0;
    let shakeY = 0;
    const isImpact = p >= T.impact[0] && p <= T.impact[1];
    if (isImpact) {
      const qn = Math.floor(p * 400);
      shakeX += (hash01(qn, 9) - 0.5) * 8;
      shakeY += (hash01(qn, 10) - 0.5) * 6;
    } else if (p >= W.shake[0] && p <= W.shake[1]) {
      const amp = (1 - seg(p, W.shake[0], W.shake[1])) * 14;
      const seed = Math.floor(p * 20);
      shakeX = (hash01(seed, 1) - 0.5) * amp * 2;
      shakeY = (hash01(seed, 2) - 0.5) * amp * 2;
    }

    if (groupRef.current) {
      groupRef.current.setAttribute(
        'transform',
        `translate(${1200 + shakeX}, ${1900 + translateY + shakeY})`
      );
    }

    // 2. Ports illumination
    const pLit = {
      relay1: p >= 77.6,
      esp32: p >= 76.0,
      relay2: p >= 78.0,
      temp: p >= 76.8,
      hum: p >= 77.2,
      pir: p >= 76.4,
      yolo: p >= 78.4,
    };

    // 3. Screen checks (83.2 -> 86.6)
    const chkSensors = p >= W.checkSensors[0];
    const chkEsp32 = p >= W.checkEsp32[0];
    const chkCamera = p >= W.checkCamera[0];
    const chkYolo = p >= W.checkYolo[0];
    const chkDatabase = p >= W.checkDatabase[0];

    // 4. Cracks (87.0 -> 87.6)
    const crackProg = seg(p, W.crack[0], W.crack[1]);

    // 5. 404 Glitch State (88.0 -> 90.0)
    const is404Mode = p >= W.screen404Swap && p < 90.0;
    let gOffset = 0;
    let sY = -250;
    if (is404Mode) {
      const glitchSeed = Math.floor(p * 8);
      gOffset = (hash01(glitchSeed, 3) - 0.5) * 36;
      const scanProg = seg(p, W.scanline[0], W.scanline[1]);
      sY = -250 + scanProg * 500;
    }

    setMonitorState({
      mode: is404Mode ? '404' : 'CHECKS',
      checks: {
        sensors: chkSensors,
        esp32: chkEsp32,
        camera: chkCamera,
        yolo: chkYolo,
        database: chkDatabase,
      },
      crack: crackProg,
      glitchOffset: gOffset,
      scanlineY: sY,
      portsLit: pLit,
    });
  });

  return (
    <g ref={groupRef} id="scene-11-12-monitor">
      {/* 1. Host Computer Monitor Hardware */}
      <Monitor
        mode={monitorState.mode}
        checkProgress={monitorState.checks}
        crackProgress={monitorState.crack}
        glitchOffset={monitorState.glitchOffset}
        scanlineY={monitorState.scanlineY}
        portsLit={monitorState.portsLit}
      />

      {/* 2. White Screen Overlay Flash on Impact (§4.9.2) */}
      <rect
        ref={flashRef}
        x={-520}
        y={-240}
        width={1040}
        height={560}
        rx={6}
        fill="#FFFFFF"
        pointerEvents="none"
        style={{ opacity: 0 }}
      />

      {/* 3. Computer Input Impact Bursts (§4.9.1) at local (0, -340) = world (1200, 1560) */}
      <ImpactBurst
        cx={0}
        cy={-340}
        size={128}
        rays={14}
        palette="fire"
        win={T.impact}
        seed={801}
      />
      <ImpactBurst
        cx={0}
        cy={-340}
        size={100}
        rays={10}
        palette="cyan"
        win={[T.impact[0] + 0.003, T.impact[1]]}
        seed={802}
      />
    </g>
  );
};
