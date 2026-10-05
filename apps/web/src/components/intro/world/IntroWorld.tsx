import React, { useRef, useState } from 'react';
import { useTrack } from '../engine/useTrack';
import { getCameraAt } from '../engine/timeline';
import type { LayoutMode } from '../engine/types';
import { useEnergyScale } from '../energy/useEnergyScale';
import { IntroScene } from './scenes/IntroScene';
import { Esp32Scene } from './scenes/Esp32Scene';
import { SensorScene } from './scenes/SensorScene';
import { SensorWireSystem } from './scenes/SensorWireSystem';
import { DataFlowScene } from './scenes/DataFlowScene';
import { RelayScene } from './scenes/RelayScene';
import { EnergyScene } from './scenes/EnergyScene';
import { VisionScene } from './scenes/VisionScene';
import { DataExplosionScene } from './scenes/DataExplosionScene';
import { ComputerScene } from './scenes/ComputerScene';
import { Error404Scene } from './scenes/Error404Scene';

interface IntroWorldProps {
  frozenP?: number;
}

export const IntroWorld: React.FC<IntroWorldProps> = ({ frozenP }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const cameraRef = useRef<SVGGElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('LANDSCAPE');

  useEnergyScale(svgRef);

  useTrack((p, ctx) => {
    const effectiveP = frozenP !== undefined ? frozenP : p;
    setLayoutMode(ctx.layout);

    // Compute Camera Transform (cx, cy, z)
    const cam = getCameraAt(effectiveP, ctx.layout);
    setZoomLevel(cam.z);

    if (cameraRef.current) {
      if (ctx.layout === 'PORTRAIT') {
        const tx = 450 - cam.cx * cam.z;
        const ty = 800 - cam.cy * cam.z;
        cameraRef.current.setAttribute('transform', `translate(${tx}, ${ty}) scale(${cam.z})`);
      } else {
        const tx = 800 - cam.cx * cam.z;
        const ty = 450 - cam.cy * cam.z;
        cameraRef.current.setAttribute('transform', `translate(${tx}, ${ty}) scale(${cam.z})`);
      }
    }
  });

  const viewBox = layoutMode === 'PORTRAIT' ? '0 0 900 1600' : '0 0 1600 900';

  return (
    <svg
      ref={svgRef}
      className="lp-world-svg"
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        {/* Halftone Shading Pattern (§4.5, §11.2) */}
        <pattern
          id="lp-halftone"
          x="0"
          y="0"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="4" cy="4" r="1.6" fill="#E6E0D0" />
        </pattern>
      </defs>

      {/* Camera Viewport Group (§4.4) */}
      <g id="camera" ref={cameraRef} style={{ willChange: 'transform' }}>
        {/* Layer 1: Classroom Room Ghost (Scene 01) */}
        <IntroScene zoom={zoomLevel} />

        {/* Layer 2: Trunk Data Explosion Lines (Scene 10 - under hardware) */}
        <DataExplosionScene zoom={zoomLevel} />

        {/* Layer 3: Sensor Wires (Scene 05) */}
        <SensorWireSystem zoom={zoomLevel} />

        {/* Layer 4: Relays, Loads, and Load Wires (Scene 07) */}
        <RelayScene zoom={zoomLevel} />

        {/* Layer 5: Sensors: PIR & DHT11 (Scenes 03 & 04) */}
        <SensorScene zoom={zoomLevel} />

        {/* Layer 6: ESP32 Brain (Scene 02) */}
        <Esp32Scene zoom={zoomLevel} />

        {/* Layer 7: Phone Camera & YOLO11n Vision Layer (Scene 09) */}
        <VisionScene zoom={zoomLevel} />

        {/* Layer 8: Energy Saving Decision Logic & Commands (Scene 08) */}
        <EnergyScene zoom={zoomLevel} />

        {/* Layer 9: Sensor Data Packets (Scene 06) */}
        <DataFlowScene zoom={zoomLevel} />

        {/* Layer 10: Host Computer Monitor (Scene 11) */}
        <ComputerScene zoom={zoomLevel} />

        {/* Layer 11: Theatrical 404 Overlay Bar (Scene 12) */}
        <Error404Scene zoom={zoomLevel} />
      </g>
    </svg>
  );
};
