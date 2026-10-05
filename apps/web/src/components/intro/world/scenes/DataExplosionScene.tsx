import React, { useRef, useState } from 'react';
import { useTrack } from '../../engine/useTrack';
import { seg } from '../../engine/timeline';
import { inOutSine } from '../../engine/easing';
import { LANDSCAPE_PATHS } from '../../engine/paths';
import { DataPacket } from '../../primitives/DataPacket';
import { EnergyStorm } from '../../energy/EnergyStorm';

interface DataExplosionSceneProps {
  zoom?: number;
}

export const DataExplosionScene: React.FC<DataExplosionSceneProps> = ({ zoom = 1 }) => {
  const groupRef = useRef<SVGGElement>(null);

  const [packetU, setPacketU] = useState({
    esp32: 0,
    pir: 0,
    dhtTemp: 0,
    dhtHum: 0,
    relay1: 0,
    relay2: 0,
    yolo: 0,
  });

  useTrack((p) => {
    // Visible 70 to 86
    if (p < 70 || p > 86) {
      if (groupRef.current) groupRef.current.setAttribute('visibility', 'hidden');
      return;
    }
    if (groupRef.current) groupRef.current.setAttribute('visibility', 'visible');

    // 2. Packets progression (76 -> 80.6)
    const uEsp = seg(p, 76.0, 78.0, inOutSine);
    const uPir = seg(p, 76.4, 79.0, inOutSine);
    const uTemp = seg(p, 76.8, 79.4, inOutSine);
    const uHum = seg(p, 77.2, 79.8, inOutSine);
    const uR1 = seg(p, 77.6, 80.0, inOutSine);
    const uR2 = seg(p, 78.0, 80.3, inOutSine);
    const uYolo = seg(p, 78.4, 80.6, inOutSine);

    setPacketU({
      esp32: uEsp,
      pir: uPir,
      dhtTemp: uTemp,
      dhtHum: uHum,
      relay1: uR1,
      relay2: uR2,
      yolo: uYolo,
    });
  });

  return (
    <g ref={groupRef} id="scene-10-data-explosion">
      {/* Invisible reference paths preserved for geometry / packet tracking (§7.1) */}
      <path d={LANDSCAPE_PATHS.trunkEsp32} fill="none" stroke="none" opacity={0} />
      <path d={LANDSCAPE_PATHS.trunkPir} fill="none" stroke="none" opacity={0} />
      <path d={LANDSCAPE_PATHS.trunkRelay1} fill="none" stroke="none" opacity={0} />
      <path d={LANDSCAPE_PATHS.trunkRelay2} fill="none" stroke="none" opacity={0} />
      <path d={LANDSCAPE_PATHS.trunkDhtTemp} fill="none" stroke="none" opacity={0} />
      <path d={LANDSCAPE_PATHS.trunkDhtHum} fill="none" stroke="none" opacity={0} />
      <path d={LANDSCAPE_PATHS.trunkYolo} fill="none" stroke="none" opacity={0} />

      {/* Procedural Electrical Storm Layer (8 trunks + 6 ambient arcs, §4.8) */}
      <EnergyStorm />

      {/* 7 Data Packets Riding the Trunk Lines */}
      <DataPacket
        text="POST /api/sensor-data"
        pathD={LANDSCAPE_PATHS.trunkEsp32}
        u={packetU.esp32}
        fill="#356AE6"
        textColor="#F4F0E6"
        zoom={zoom}
        visible={packetU.esp32 > 0 && packetU.esp32 < 1}
      />
      <DataPacket
        text="OCCUPANCY: 1"
        pathD={LANDSCAPE_PATHS.trunkPir}
        u={packetU.pir}
        fill="#27C7E8"
        zoom={zoom}
        visible={packetU.pir > 0 && packetU.pir < 1}
      />
      <DataPacket
        text="TEMP: 28.4"
        pathD={LANDSCAPE_PATHS.trunkDhtTemp}
        u={packetU.dhtTemp}
        fill="#27C7E8"
        zoom={zoom}
        visible={packetU.dhtTemp > 0 && packetU.dhtTemp < 1}
      />
      <DataPacket
        text="HUMIDITY: 61"
        pathD={LANDSCAPE_PATHS.trunkDhtHum}
        u={packetU.dhtHum}
        fill="#27C7E8"
        zoom={zoom}
        visible={packetU.dhtHum > 0 && packetU.dhtHum < 1}
      />
      <DataPacket
        text="LIGHT: ON"
        pathD={LANDSCAPE_PATHS.trunkRelay1}
        u={packetU.relay1}
        fill="#27C7E8"
        zoom={zoom}
        visible={packetU.relay1 > 0 && packetU.relay1 < 1}
      />
      <DataPacket
        text="AC: OFF"
        pathD={LANDSCAPE_PATHS.trunkRelay2}
        u={packetU.relay2}
        fill="#27C7E8"
        zoom={zoom}
        visible={packetU.relay2 > 0 && packetU.relay2 < 1}
      />
      <DataPacket
        text="YOLO: 1 PERSON"
        pathD={LANDSCAPE_PATHS.trunkYolo}
        u={packetU.yolo}
        fill="#27C7E8"
        zoom={zoom}
        visible={packetU.yolo > 0 && packetU.yolo < 1}
      />
    </g>
  );
};
