import React, { useRef, useState } from 'react';
import { useTrack } from '../../engine/useTrack';
import { W, seg } from '../../engine/timeline';
import { LANDSCAPE_PATHS } from '../../engine/paths';
import { WirePath } from '../../primitives/WirePath';
import { PulseRing } from '../../primitives/PulseRing';
import { Stamp } from '../../primitives/Stamp';

interface SensorWireSystemProps {
  zoom?: number;
}

export const SensorWireSystem: React.FC<SensorWireSystemProps> = ({ zoom = 1 }) => {
  const groupRef = useRef<SVGGElement>(null);
  const [wireProgress, setWireProgress] = useState({
    pirSig: 0,
    pirVcc: 0,
    pirGnd: 0,
    dhtSig: 0,
    dhtVcc: 0,
    dhtGnd: 0,
  });
  const [pulses, setPulses] = useState({
    pir: 0,
    dht: 0,
  });
  const [stamp, setStamp] = useState({
    opacity: 0,
    scale: 1,
  });

  useTrack((p) => {
    // Visible from 34 to 90
    if (p < 33.5 || p > 90) {
      if (groupRef.current) groupRef.current.setAttribute('visibility', 'hidden');
      return;
    }
    if (groupRef.current) groupRef.current.setAttribute('visibility', 'visible');

    // 1. PIR wires draw (34 -> 37.5)
    const pSig = seg(p, W.pirWireSig[0], W.pirWireSig[1]);
    const pVcc = seg(p, W.pirWireVcc[0], W.pirWireVcc[1]);
    const pGnd = seg(p, W.pirWireGnd[0], W.pirWireGnd[1]);

    // 2. DHT wires draw (36 -> 39.5)
    const dSig = seg(p, W.dhtWireSig[0], W.dhtWireSig[1]);
    const dVcc = seg(p, W.dhtWireVcc[0], W.dhtWireVcc[1]);
    const dGnd = seg(p, W.dhtWireGnd[0], W.dhtWireGnd[1]);

    setWireProgress({
      pirSig: pSig,
      pirVcc: pVcc,
      pirGnd: pGnd,
      dhtSig: dSig,
      dhtVcc: dVcc,
      dhtGnd: dGnd,
    });

    // 3. Pulse rings
    const pulsePir = seg(p, W.pirWirePulse[0], W.pirWirePulse[1]);
    const pulseDht = seg(p, W.dhtWirePulse[0], W.dhtWirePulse[1]);
    setPulses({ pir: pulsePir, dht: pulseDht });

    // 4. SIGNAL CONNECTED Stamp (in 39.8 -> 40.4, visible until 45)
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
      {/* PIR 3 Wires */}
      <WirePath
        d={LANDSCAPE_PATHS.pirSig}
        progress={wireProgress.pirSig}
        outerWidth={14}
        coreWidth={6}
        coreColor="#FFD83D"
        plugEnd
      />
      <WirePath
        d={LANDSCAPE_PATHS.pirVcc}
        progress={wireProgress.pirVcc}
        outerWidth={8}
        hasCore={false}
        plugEnd
      />
      <WirePath
        d={LANDSCAPE_PATHS.pirGnd}
        progress={wireProgress.pirGnd}
        outerWidth={8}
        hasCore={false}
        plugEnd
      />

      {/* DHT 3 Wires */}
      <WirePath
        d={LANDSCAPE_PATHS.dhtSig}
        progress={wireProgress.dhtSig}
        outerWidth={14}
        coreWidth={6}
        coreColor="#27C7E8"
        plugEnd
      />
      <WirePath
        d={LANDSCAPE_PATHS.dhtVcc}
        progress={wireProgress.dhtVcc}
        outerWidth={8}
        hasCore={false}
        plugEnd
      />
      <WirePath
        d={LANDSCAPE_PATHS.dhtGnd}
        progress={wireProgress.dhtGnd}
        outerWidth={8}
        hasCore={false}
        plugEnd
      />

      {/* Connection Pulse Rings at ESP32 Pads */}
      <PulseRing cx={1092} cy={560} progress={pulses.pir} color="#FFD83D" />
      <PulseRing cx={1308} cy={560} progress={pulses.dht} color="#27C7E8" />

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
