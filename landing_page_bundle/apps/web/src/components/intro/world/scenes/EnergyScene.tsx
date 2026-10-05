import React, { useRef, useState } from 'react';
import { useTrack } from '../../engine/useTrack';
import { W, seg } from '../../engine/timeline';
import { inOutSine } from '../../engine/easing';
import { LANDSCAPE_PATHS } from '../../engine/paths';
import { DataPacket } from '../../primitives/DataPacket';
import { Stamp } from '../../primitives/Stamp';

interface EnergySceneProps {
  zoom?: number;
}

export const EnergyScene: React.FC<EnergySceneProps> = ({ zoom = 1 }) => {
  const groupRef = useRef<SVGGElement>(null);
  const [stamps, setStamps] = useState({
    noPeople: 0,
    roomIdle: 0,
    energySave: 0,
    lightOff: 0,
    acOff: 0,
  });
  const [chips, setChips] = useState({
    sense: false,
    decide: false,
    act: false,
  });
  const [pktU, setPktU] = useState({
    motion0: 0,
    cmdOff1: 0,
    cmdOff2: 0,
  });

  useTrack((p) => {
    // Visible 54.5 to 61.5
    if (p < 54.5 || p > 61.5) {
      if (groupRef.current) groupRef.current.setAttribute('visibility', 'hidden');
      return;
    }
    if (groupRef.current) groupRef.current.setAttribute('visibility', 'visible');

    // 1. Stamps in/out
    const fadeOut = 1 - seg(p, 59.8, 61.0);
    const sNoPeople = seg(p, W.noPeople[0], W.noPeople[1]) * fadeOut;
    const sRoomIdle = seg(p, W.roomIdle[0], W.roomIdle[1]) * fadeOut;
    const sEnergySave = seg(p, W.energySave[0], W.energySave[1]) * fadeOut;
    const sLightOff = seg(p, 59.2, 59.9) * fadeOut;
    const sAcOff = seg(p, 59.6, 60.3) * fadeOut;

    setStamps({
      noPeople: sNoPeople,
      roomIdle: sRoomIdle,
      energySave: sEnergySave,
      lightOff: sLightOff,
      acOff: sAcOff,
    });

    // 2. SENSE -> DECIDE -> ACT Chip activation states
    setChips({
      sense: p >= W.senseChip[0],
      decide: p >= W.decideChip[0],
      act: p >= W.actChip[0],
    });

    // 3. MOTION: 0 and CMD: OFF Packets
    const uMotion0 = seg(p, W.pktMotion0[0], W.pktMotion0[1], inOutSine);
    const uCmd1 = seg(p, W.cmdOffPackets[0], W.cmdOffPackets[1], inOutSine);
    const uCmd2 = seg(p, W.cmdOffPackets[0] + 0.1, W.cmdOffPackets[1], inOutSine);

    setPktU({
      motion0: uMotion0,
      cmdOff1: uCmd1,
      cmdOff2: uCmd2,
    });
  });

  const invZ = 1 / (zoom || 1);

  return (
    <g ref={groupRef} id="scene-08-energy-control">
      {/* 1. SENSE -> DECIDE -> ACT Chip Row (Non-negotiable correction 6: DECISION LOGIC / COMMAND) */}
      <g transform={`translate(1200, 200) scale(${invZ})`}>
        {/* Shadow */}
        <rect x={-270 + 6} y={-24 + 6} width={540} height={48} fill="#111111" />
        {/* Frame */}
        <rect x={-270} y={-24} width={540} height={48} fill="#F4F0E6" stroke="#111111" strokeWidth={3} />

        {/* SENSE Chip */}
        <g transform="translate(-170, 0)">
          <rect
            x={-60}
            y={-16}
            width={120}
            height={32}
            fill={chips.sense ? '#FFD83D' : '#E6E0D0'}
            stroke="#111111"
            strokeWidth={2}
          />
          <text x={0} y={5} fontSize={11} fontWeight={900} fontFamily="'Archivo', sans-serif" fill="#111111" textAnchor="middle">
            1. SENSING
          </text>
        </g>

        {/* Arrow */}
        <text x={-90} y={5} fontSize={16} fontWeight={900} fill="#111111">
          →
        </text>

        {/* DECIDE Chip (Rule Engine / Decision Layer) */}
        <g transform="translate(0, 0)">
          <rect
            x={-70}
            y={-16}
            width={140}
            height={32}
            fill={chips.decide ? '#FFD83D' : '#E6E0D0'}
            stroke="#111111"
            strokeWidth={2}
          />
          <text x={0} y={5} fontSize={11} fontWeight={900} fontFamily="'Archivo', sans-serif" fill="#111111" textAnchor="middle">
            2. DECISION LOGIC
          </text>
        </g>

        {/* Arrow */}
        <text x={90} y={5} fontSize={16} fontWeight={900} fill="#111111">
          →
        </text>

        {/* ACT Chip */}
        <g transform="translate(170, 0)">
          <rect
            x={-60}
            y={-16}
            width={120}
            height={32}
            fill={chips.act ? '#FFD83D' : '#E6E0D0'}
            stroke="#111111"
            strokeWidth={2}
          />
          <text x={0} y={5} fontSize={11} fontWeight={900} fontFamily="'Archivo', sans-serif" fill="#111111" textAnchor="middle">
            3. RELAY ACTION
          </text>
        </g>
      </g>

      {/* 2. Top-Center Energy Control Stamps Stack */}
      {stamps.noPeople > 0.05 && (
        <Stamp
          x={1200}
          y={280}
          text="NO PEOPLE DETECTED"
          subtext="PIR INACTIVITY TIMEOUT"
          fill="#F4F0E6"
          opacity={stamps.noPeople}
          rotation={-2}
          zoom={zoom}
        />
      )}

      {stamps.roomIdle > 0.05 && (
        <Stamp
          x={1200}
          y={340}
          text="ROOM STATE: IDLE"
          subtext="ZERO HUMAN PRESENCE CONFIRMED"
          fill="#FFD83D"
          opacity={stamps.roomIdle}
          rotation={2}
          zoom={zoom}
        />
      )}

      {stamps.energySave > 0.05 && (
        <Stamp
          x={1200}
          y={400}
          text="ENERGY SAVING TRIGGERED"
          subtext="CUTTING UNNECESSARY APPLIANCE LOADS"
          fill="#35C759"
          opacity={stamps.energySave}
          rotation={-1}
          zoom={zoom}
        />
      )}

      {/* 3. Action Complete Stamps */}
      {stamps.lightOff > 0.05 && (
        <Stamp
          x={400}
          y={1220}
          text="LIGHTS → SHUTDOWN"
          fill="#FFD83D"
          opacity={stamps.lightOff}
          rotation={-3}
          zoom={zoom}
        />
      )}

      {stamps.acOff > 0.05 && (
        <Stamp
          x={2000}
          y={1220}
          text="AC → SHUTDOWN"
          fill="#FFD83D"
          opacity={stamps.acOff}
          rotation={3}
          zoom={zoom}
        />
      )}

      {/* 4. MOTION: 0 Packet along PIR Wire */}
      <DataPacket
        text="MOTION: 0"
        pathD={LANDSCAPE_PATHS.pirSig}
        u={pktU.motion0}
        fill="#27C7E8"
        zoom={zoom}
        visible={pktU.motion0 > 0 && pktU.motion0 < 1}
      />

      {/* 5. Two CMD: OFF Packets along Relay Signal Wires */}
      <DataPacket
        text="CMD: OFF"
        pathD={LANDSCAPE_PATHS.relay1Sig}
        u={pktU.cmdOff1}
        fill="#FFD83D"
        zoom={zoom}
        visible={pktU.cmdOff1 > 0 && pktU.cmdOff1 < 1}
      />
      <DataPacket
        text="CMD: OFF"
        pathD={LANDSCAPE_PATHS.relay2Sig}
        u={pktU.cmdOff2}
        fill="#FFD83D"
        zoom={zoom}
        visible={pktU.cmdOff2 > 0 && pktU.cmdOff2 < 1}
      />
    </g>
  );
};
