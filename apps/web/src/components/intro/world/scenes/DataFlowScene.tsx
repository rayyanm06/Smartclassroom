import React, { useRef, useState } from 'react';
import { useTrack } from '../../engine/useTrack';
import { W, seg } from '../../engine/timeline';
import { inOutSine } from '../../engine/easing';
import { LANDSCAPE_PATHS } from '../../engine/paths';
import { DataPacket } from '../../primitives/DataPacket';
import { TelemetryBadge } from '../../primitives/TelemetryBadge';

interface DataFlowSceneProps {
  zoom?: number;
}

export const DataFlowScene: React.FC<DataFlowSceneProps> = ({ zoom = 1 }) => {
  const groupRef = useRef<SVGGElement>(null);
  const [packetU, setPacketU] = useState({
    motion: 0,
    temp: 0,
    hum: 0,
  });

  useTrack((p) => {
    // Visible from 40.5 to 46.5
    if (p < 40.5 || p > 46.5) {
      if (groupRef.current) groupRef.current.setAttribute('visibility', 'hidden');
      return;
    }
    if (groupRef.current) groupRef.current.setAttribute('visibility', 'visible');

    const uMotion = seg(p, W.pktMotion[0], W.pktMotion[1], inOutSine);
    const uTemp = seg(p, W.pktTemp[0], W.pktTemp[1], inOutSine);
    const uHum = seg(p, W.pktHum[0], W.pktHum[1], inOutSine);

    setPacketU({
      motion: uMotion,
      temp: uTemp,
      hum: uHum,
    });
  });

  return (
    <g ref={groupRef} id="scene-06-data-flow">
      {/* 1. MOTION: 1 Packet on PIR Wire */}
      <DataPacket
        text="MOTION: 1"
        pathD={LANDSCAPE_PATHS.pirSig}
        u={packetU.motion}
        fill="#27C7E8"
        zoom={zoom}
        visible={packetU.motion > 0 && packetU.motion < 1}
      />

      {/* 2. TEMP: 28.4°C Packet on DHT Wire */}
      <DataPacket
        text="TEMP: 28.4°C"
        pathD={LANDSCAPE_PATHS.dhtSig}
        u={packetU.temp}
        fill="#27C7E8"
        zoom={zoom}
        visible={packetU.temp > 0 && packetU.temp < 1}
      />

      {/* 3. HUMIDITY: 61% Packet on DHT Wire */}
      <DataPacket
        text="HUMIDITY: 61%"
        pathD={LANDSCAPE_PATHS.dhtSig}
        u={packetU.hum}
        fill="#27C7E8"
        zoom={zoom}
        visible={packetU.hum > 0 && packetU.hum < 1}
      />

      {/* Hardware Honesty Chip: SAMPLE VALUES (Non-negotiable correction 5) */}
      <TelemetryBadge
        x={1140}
        y={280}
        variant="SAMPLE_VALUES"
        customText="SAMPLE VALUES · NOT FETCHED"
        zoom={zoom}
      />
    </g>
  );
};
