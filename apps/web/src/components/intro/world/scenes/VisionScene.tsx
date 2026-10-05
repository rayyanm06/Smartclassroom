import React, { useRef, useState } from 'react';
import { useTrack } from '../../engine/useTrack';
import { W, seg, lerp } from '../../engine/timeline';
import { outCubic } from '../../engine/easing';
import { LANDSCAPE_PATHS } from '../../engine/paths';
import { PhoneCamera } from '../hardware/PhoneCamera';
import { WirePath } from '../../primitives/WirePath';
import { Stamp } from '../../primitives/Stamp';
import { TelemetryBadge } from '../../primitives/TelemetryBadge';
import { LightningBolt } from '../../energy/LightningBolt';
import { T } from '../../energy/energyTimeline';

interface VisionSceneProps {
  zoom?: number;
}

export const VisionScene: React.FC<VisionSceneProps> = ({ zoom = 1 }) => {
  const groupRef = useRef<SVGGElement>(null);
  const phoneRef = useRef<SVGGElement>(null);

  const [state, setState] = useState({
    frameOpen: 0,
    rtspWire: 0,
    personWalk: 0,
    detectBox: 0,
    showOccupied: false,
    privacyStamp: 0,
    pipeline: {
      rtsp: false,
      opencv: false,
      yolo: false,
      fastapi: false,
    },
  });

  useTrack((p) => {
    // Visible from 60.5 to 82
    if (p < 60.5 || p > 82) {
      if (groupRef.current) groupRef.current.setAttribute('visibility', 'hidden');
      return;
    }
    if (groupRef.current) groupRef.current.setAttribute('visibility', 'visible');

    // 1. Phone slides in from right (61 -> 63.5)
    if (phoneRef.current) {
      let phX = 2440;
      let phRot = 0;
      if (p < W.phoneIn[0]) {
        phX = 2840;
        phRot = 6;
      } else if (p < W.phoneIn[1]) {
        const t = seg(p, W.phoneIn[0], W.phoneIn[1], outCubic);
        phX = lerp(2840, 2440, t);
        phRot = lerp(6, 0, t);
      }
      phoneRef.current.setAttribute('transform', `translate(${phX}, 760) rotate(${phRot})`);
    }

    // 2. Frame window opens (62.5 -> 63.8)
    const fOpen = seg(p, W.frameOpen[0], W.frameOpen[1], outCubic);

    // 3. RTSP wire draws (63.5 -> 64.5)
    const rWire = seg(p, W.rtspWire[0], W.rtspWire[1]);

    // 4. Person walks in (64 -> 66.5)
    const pWalk = seg(p, W.personWalk[0], W.personWalk[1]);

    // 5. YOLO bounding box draws (66.5 -> 67.3)
    const dBox = seg(p, W.detectBox[0], W.detectBox[1], outCubic);

    // 6. Occupied state badge (68.4 -> 71.0)
    const occ = p >= W.countPlate[0];

    // 7. Privacy stamp (67.5 -> 70.5)
    const privT = seg(p, W.privacyStamp[0], W.privacyStamp[1]) * (1 - seg(p, 70.5, 71.5));

    // 8. Pipeline chips row activation
    const pipeRtsp = p >= 64.5;
    const pipeCv = p >= 65.3;
    const pipeYolo = p >= 66.5;
    const pipeApi = p >= 68.5;

    setState({
      frameOpen: fOpen,
      rtspWire: rWire,
      personWalk: pWalk,
      detectBox: dBox,
      showOccupied: occ,
      privacyStamp: privT,
      pipeline: {
        rtsp: pipeRtsp,
        opencv: pipeCv,
        yolo: pipeYolo,
        fastapi: pipeApi,
      },
    });
  });

  const invZ = 1 / (zoom || 1);

  return (
    <g ref={groupRef} id="scene-09-vision">
      {/* Phone Camera with Viewport Frame and YOLO Person */}
      <g ref={phoneRef}>
        <PhoneCamera
          frameOpenProgress={state.frameOpen}
          personWalkProgress={state.personWalk}
          boxProgress={state.detectBox}
          showOccupied={state.showOccupied}
        />
        <TelemetryBadge x={-60} y={190} variant="LIVE_PROTOTYPE" zoom={zoom} />
      </g>

      {/* RTSP Signal Cable (Phone -> Viewport) */}
      <WirePath
        d={LANDSCAPE_PATHS.rtsp}
        progress={state.rtspWire}
        outerWidth={10}
        coreWidth={4}
        coreColor="#FFD83D"
      />

      {/* Pipeline Chips Row (y = 960: CAMERA -> OPENCV -> YOLO11n -> FASTAPI -> OCCUPANCY) */}
      <g transform={`translate(2900, 960) scale(${invZ})`}>
        {/* Frame Plate */}
        <rect x={-400 + 6} y={-24 + 6} width={800} height={48} fill="#111111" />
        <rect x={-400} y={-24} width={800} height={48} fill="#F4F0E6" stroke="#111111" strokeWidth={3} />

        {/* 1. CAMERA / RTSP */}
        <g transform="translate(-320, 0)">
          <rect
            x={-55}
            y={-16}
            width={110}
            height={32}
            fill={state.pipeline.rtsp ? '#FFD83D' : '#E6E0D0'}
            stroke={state.pipeline.rtsp ? '#27C7E8' : '#111111'}
            strokeWidth={2}
          />
          <text x={0} y={5} fontSize={10} fontWeight={900} fontFamily="'Archivo', sans-serif" fill="#111111" textAnchor="middle">
            1. CAMERA
          </text>
        </g>

        {/* Bolt 0: CAMERA -> OPENCV */}
        <LightningBolt
          seed={501}
          guideD="M -265 0 L -215 0"
          palette="cyan"
          win={T.pipe[0]}
          ampRatio={0.035}
          branchCount={2}
          samples={8}
        />

        {/* 2. OpenCV */}
        <g transform="translate(-160, 0)">
          <rect
            x={-55}
            y={-16}
            width={110}
            height={32}
            fill={state.pipeline.opencv ? '#FFD83D' : '#E6E0D0'}
            stroke={state.pipeline.opencv ? '#27C7E8' : '#111111'}
            strokeWidth={2}
          />
          <text x={0} y={5} fontSize={10} fontWeight={900} fontFamily="'Archivo', sans-serif" fill="#111111" textAnchor="middle">
            2. OPENCV
          </text>
        </g>

        {/* Bolt 1: OPENCV -> YOLO11n */}
        <LightningBolt
          seed={502}
          guideD="M -105 0 L -55 0"
          palette="cyan"
          win={T.pipe[1]}
          ampRatio={0.035}
          branchCount={2}
          samples={8}
        />

        {/* 3. YOLO11n */}
        <g transform="translate(0, 0)">
          <rect
            x={-55}
            y={-16}
            width={110}
            height={32}
            fill={state.pipeline.yolo ? '#FFD83D' : '#E6E0D0'}
            stroke={state.pipeline.yolo ? '#27C7E8' : '#111111'}
            strokeWidth={2}
          />
          <text x={0} y={5} fontSize={10} fontWeight={900} fontFamily="'Archivo', sans-serif" fill="#111111" textAnchor="middle">
            3. YOLO11n
          </text>
        </g>

        {/* Bolt 2: YOLO11n -> FASTAPI */}
        <LightningBolt
          seed={503}
          guideD="M 55 0 L 105 0"
          palette="cyan"
          win={T.pipe[2]}
          ampRatio={0.035}
          branchCount={2}
          samples={8}
        />

        {/* 4. FastAPI */}
        <g transform="translate(160, 0)">
          <rect
            x={-55}
            y={-16}
            width={110}
            height={32}
            fill={state.pipeline.fastapi ? '#FFD83D' : '#E6E0D0'}
            stroke={state.pipeline.fastapi ? '#27C7E8' : '#111111'}
            strokeWidth={2}
          />
          <text x={0} y={5} fontSize={10} fontWeight={900} fontFamily="'Archivo', sans-serif" fill="#111111" textAnchor="middle">
            4. FASTAPI
          </text>
        </g>

        {/* Bolt 3: FASTAPI -> OCCUPANCY */}
        <LightningBolt
          seed={504}
          guideD="M 215 0 L 265 0"
          palette="cyan"
          win={T.pipe[3]}
          ampRatio={0.035}
          branchCount={2}
          samples={8}
        />

        {/* 5. Final Occupancy Result Chip (§4.7.8) */}
        <g transform="translate(325, 0)">
          <rect
            x={-60}
            y={-16}
            width={120}
            height={32}
            fill={state.showOccupied ? '#35C759' : '#E6E0D0'}
            stroke={state.showOccupied ? '#111111' : '#888888'}
            strokeWidth={2}
          />
          <text
            x={0}
            y={5}
            fontSize={9}
            fontWeight={900}
            fontFamily="'Archivo', sans-serif"
            fill={state.showOccupied ? '#FFFFFF' : '#111111'}
            textAnchor="middle"
          >
            OCCUPANCY: 1
          </text>
        </g>
      </g>

      {/* Privacy Policy Compliance Stamp */}
      {state.privacyStamp > 0.05 && (
        <Stamp
          x={2900}
          y={400}
          text="NO FACE RECOGNITION"
          subtext="PEOPLE COUNTING ONLY · PRIVACY PRESERVING"
          fill="#F4F0E6"
          opacity={state.privacyStamp}
          rotation={-2}
          zoom={zoom}
        />
      )}
    </g>
  );
};
