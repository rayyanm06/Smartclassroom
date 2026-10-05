import React, { useRef, useState } from 'react';
import { useTrack } from '../../engine/useTrack';
import { W, seg } from '../../engine/timeline';
import { LANDSCAPE_PATHS } from '../../engine/paths';
import { Stamp } from '../../primitives/Stamp';
import { LightningBolt } from '../../energy/LightningBolt';
import { ImpactBurst } from '../../energy/ImpactBurst';
import { T } from '../../energy/energyTimeline';

interface SensorWireSystemProps {
  zoom?: number;
}

export const SensorWireSystem: React.FC<SensorWireSystemProps> = ({ zoom = 1 }) => {
  const groupRef = useRef<SVGGElement>(null);
  const [stamp, setStamp] = useState({
    opacity: 0,
    scale: 1,
  });

  useTrack((p) => {
    // Visible from 33.5 to 90
    if (p < 33.5 || p > 90) {
      if (groupRef.current) groupRef.current.setAttribute('visibility', 'hidden');
      return;
    }
    if (groupRef.current) groupRef.current.setAttribute('visibility', 'visible');

    // SIGNAL CONNECTED Stamp (in 39.8 -> 40.4, visible until 45)
    if (p >= 39.8 && p <= 45.5) {
      const inT = seg(p, W.signalConnectedStamp[0], W.signalConnectedStamp[1]);
      const outT = seg(p, 44.5, 45.5);
      const op = inT * (1 - outT);
      const sc = 1.3 - inT * 0.3; // Pop 1.3 -> 1.0
      setStamp({ opacity: op, scale: sc });
    } else {
      setStamp({ opacity: 0, scale: 1 });
    }
  });

  return (
    <g ref={groupRef} id="scene-05-sensor-wires">
      {/* Invisible reference paths preserved for geometry / packet tracking (§7.1) */}
      <path d={LANDSCAPE_PATHS.pirSig} fill="none" stroke="none" opacity={0} />
      <path d={LANDSCAPE_PATHS.pirVcc} fill="none" stroke="none" opacity={0} />
      <path d={LANDSCAPE_PATHS.pirGnd} fill="none" stroke="none" opacity={0} />
      <path d={LANDSCAPE_PATHS.dhtSig} fill="none" stroke="none" opacity={0} />
      <path d={LANDSCAPE_PATHS.dhtVcc} fill="none" stroke="none" opacity={0} />
      <path d={LANDSCAPE_PATHS.dhtGnd} fill="none" stroke="none" opacity={0} />

      {/* 1. PIR Sensor Energy Sequence (§4.3) */}
      {/* Charge burst at sensor connector (818, 640) */}
      <ImpactBurst
        cx={818}
        cy={640}
        win={T.pirCharge}
        size={32}
        palette="fire"
        seed={111}
        rays={6}
      />
      {/* PIR Lightning Bolt (sensor -> ESP32 pad 1092, 560) */}
      <LightningBolt
        seed={101}
        guideD={LANDSCAPE_PATHS.pirSig}
        palette="fire"
        win={T.pirBolt}
        ampRatio={0.05}
        samples={14}
        branchCount={5}
      />
      {/* Impact burst at ESP32 GPIO27 pad (1092, 560) */}
      <ImpactBurst
        cx={1092}
        cy={560}
        win={T.pirImpact}
        size={48}
        palette="fire"
        seed={112}
        rays={8}
      />

      {/* 2. DHT11 Sensor Energy Sequence (§4.3) */}
      {/* Charge burst at sensor connector (1602, 600) */}
      <ImpactBurst
        cx={1602}
        cy={600}
        win={T.dhtCharge}
        size={32}
        palette="cyan"
        seed={211}
        rays={6}
      />
      {/* DHT11 Lightning Bolt (sensor -> ESP32 pad 1308, 560) */}
      <LightningBolt
        seed={202}
        guideD={LANDSCAPE_PATHS.dhtSig}
        palette="cyan"
        win={T.dhtBolt}
        ampRatio={0.04}
        samples={14}
        branchCount={4}
      />
      {/* Impact burst at ESP32 GPIO4 pad (1308, 560) */}
      <ImpactBurst
        cx={1308}
        cy={560}
        win={T.dhtImpact}
        size={48}
        palette="cyan"
        seed={212}
        rays={8}
      />

      {/* Stamp: SIGNAL CONNECTED */}
      {stamp.opacity > 0.05 && (
        <Stamp
          x={1200}
          y={330}
          text="SIGNAL CONNECTED"
          subtext="GPIO27 (PIR) · GPIO4 (DHT11)"
          fill="#FFD83D"
          scale={stamp.scale}
          opacity={stamp.opacity}
          rotation={-4}
          zoom={zoom}
        />
      )}
    </g>
  );
};
