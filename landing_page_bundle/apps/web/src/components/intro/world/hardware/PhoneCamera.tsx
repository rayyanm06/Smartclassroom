import React from 'react';

interface PhoneCameraProps {
  frameOpenProgress?: number; // 0 to 1 (scaleY from center)
  personWalkProgress?: number; // 0 to 1
  boxProgress?: number; // 0 to 1
  showOccupied?: boolean;
  className?: string;
}

export const PhoneCamera: React.FC<PhoneCameraProps> = ({
  frameOpenProgress = 1,
  personWalkProgress = 0,
  boxProgress = 0,
  showOccupied = false,
  className,
}) => {
  // Person walk pos (enters from x = -140 to 0)
  const personX = -140 + Math.min(1, personWalkProgress) * 140;
  // Bob effect: steps(2) of walk progress
  const personBob = personWalkProgress > 0 && personWalkProgress < 1 ? (Math.floor(personWalkProgress * 12) % 2 === 0 ? -4 : 0) : 0;

  const frameScaleY = Math.max(0, Math.min(1, frameOpenProgress));

  return (
    <g id="vision-phone-system" className={className}>
      {/* 1. The Phone on Tripod */}
      <g id="phone-mount" transform="translate(0, 0)">
        {/* Tripod Legs */}
        <g stroke="#111111" strokeWidth={5} strokeLinecap="round">
          <line x1={0} y1={90} x2={-55} y2={180} />
          <line x1={0} y1={90} x2={0} y2={190} />
          <line x1={0} y1={90} x2={55} y2={180} />
        </g>
        {/* Tripod Mount Clamp */}
        <rect x={-30} y={70} width={60} height={25} rx={3} fill="#26262B" stroke="#111111" strokeWidth={3} />

        {/* Phone Hard Shadow */}
        <rect x={-45 + 10} y={-95 + 10} width={90} height={170} rx={12} fill="#111111" />

        {/* Smartphone Chassis Body */}
        <rect
          x={-45}
          y={-95}
          width={90}
          height={170}
          rx={12}
          fill="#26262B"
          stroke="#111111"
          strokeWidth={4.5}
        />
        {/* Phone Back Glass Panel */}
        <rect
          x={-40}
          y={-90}
          width={80}
          height={160}
          rx={9}
          fill="#33333A"
          stroke="#F4F0E6"
          strokeWidth={1}
          opacity={0.3}
        />

        {/* Camera Lens Bump */}
        <g transform="translate(15, -60)">
          <rect x={-18} y={-18} width={36} height={48} rx={8} fill="#1A1A1E" stroke="#111111" strokeWidth={3} />
          {/* Dual Lenses */}
          <circle cx={0} cy={-5} r={9} fill="#111111" stroke="#CFCABC" strokeWidth={2} />
          <circle cx={0} cy={17} r={9} fill="#111111" stroke="#CFCABC" strokeWidth={2} />
          <circle cx={-2} cy={-6} r={3} fill="#27C7E8" />
          <circle cx={-2} cy={16} r={3} fill="#27C7E8" />
        </g>

        {/* Technical Label Plate on Phone */}
        <text
          x={0}
          y={40}
          fontSize={8}
          fontWeight={900}
          fontFamily="'Archivo', sans-serif"
          fill="#F4F0E6"
          textAnchor="middle"
          letterSpacing="0.06em"
        >
          iPHONE RTSP
        </text>

        {/* RTSP Output Jack (Right Edge) */}
        <rect x={40} y={-45} width={12} height={14} fill="#FFD83D" stroke="#111111" strokeWidth={2} />
      </g>

      {/* 2. Camera Viewport Frame (Opens vertically from center line) */}
      <g id="camera-frame-viewport" transform="translate(460, -140)">
        <g transform={`scale(1, ${frameScaleY})`}>
          {/* Hard Shadow */}
          <rect x={-260 + 12} y={-170 + 12} width={520} height={340} fill="#111111" />

          {/* Viewport Frame */}
          <rect
            x={-260}
            y={-170}
            width={520}
            height={340}
            fill="#1E2322"
            stroke="#111111"
            strokeWidth={6}
          />
          {/* Inner Grid / Silhouette */}
          <g opacity={0.25}>
            <line x1={-260} y1={90} x2={260} y2={90} stroke="#F4F0E6" strokeWidth={3} />
            <rect x={-140} y={-80} width={280} height={90} fill="#26262B" stroke="#F4F0E6" strokeWidth={2} />
          </g>

          {/* REC Tag (Top Left) */}
          <g transform="translate(-230, -140)">
            <rect x={-5} y={-12} width={75} height={24} fill="#111111" stroke="#F4F0E6" strokeWidth={1.5} />
            <circle cx={10} cy={0} r={4} fill="#E53935" />
            <text x={22} y={4} fill="#F4F0E6" fontSize={10} fontWeight={700} fontFamily="'IBM Plex Mono', monospace">
              REC ●
            </text>
          </g>

          {/* RTSP URL Header Tag */}
          <text
            x={230}
            y={-140}
            fill="#27C7E8"
            fontSize={9}
            fontWeight={600}
            fontFamily="'IBM Plex Mono', monospace"
            textAnchor="end"
          >
            rtsp://172.20.10.1:554/stream
          </text>

          {/* 3. Faceless Person Silhouette (Walks into scene) */}
          {personWalkProgress > 0.05 && (
            <g id="detected-person" transform={`translate(${personX}, ${personBob + 10})`}>
              {/* Head */}
              <circle cx={0} cy={-70} r={20} fill="#111111" stroke="#F4F0E6" strokeWidth={1.5} />
              {/* Torso */}
              <path
                d="M-28 -45 Q-20 -50 0 -50 Q20 -50 28 -45 L32 20 H-32 Z"
                fill="#111111"
                stroke="#F4F0E6"
                strokeWidth={1.5}
              />
              {/* Legs */}
              <line x1={-16} y1={20} x2={-16} y2={85} stroke="#111111" strokeWidth={10} strokeLinecap="round" />
              <line x1={16} y1={20} x2={16} y2={85} stroke="#111111" strokeWidth={10} strokeLinecap="round" />

              {/* 4. YOLO11n Cyan Bounding Box & Corner Brackets */}
              {boxProgress > 0.1 && (
                <g id="yolo-bounding-box" opacity={Math.min(1, boxProgress * 1.5)}>
                  {/* Outer Bounding Rect */}
                  <rect
                    x={-42}
                    y={-100}
                    width={84}
                    height={195}
                    fill="none"
                    stroke="#27C7E8"
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                  />

                  {/* 4 Corner Brackets (Pop in 1.4 -> 1) */}
                  {/* Top-Left */}
                  <path d="M-44 -85 V-102 H-25" fill="none" stroke="#27C7E8" strokeWidth={4} />
                  {/* Top-Right */}
                  <path d="M44 -85 V-102 H25" fill="none" stroke="#27C7E8" strokeWidth={4} />
                  {/* Bottom-Left */}
                  <path d="M-44 80 V97 H-25" fill="none" stroke="#27C7E8" strokeWidth={4} />
                  {/* Bottom-Right */}
                  <path d="M44 80 V97 H25" fill="none" stroke="#27C7E8" strokeWidth={4} />

                  {/* Classification Tag */}
                  <g transform="translate(-42, -125)">
                    <rect x={0} y={0} width={135} height={22} fill="#27C7E8" stroke="#111111" strokeWidth={2} />
                    <text
                      x={8}
                      y={15}
                      fill="#111111"
                      fontSize={10}
                      fontWeight={700}
                      fontFamily="'IBM Plex Mono', monospace"
                    >
                      PERSON · 0.94
                    </text>
                  </g>
                </g>
              )}
            </g>
          )}

          {/* Occupancy Result Badges */}
          {showOccupied && (
            <g transform="translate(140, 120)">
              {/* 1 PERSON Plate */}
              <rect x={-80} y={-30} width={90} height={26} fill="#FFD83D" stroke="#111111" strokeWidth={2.5} />
              <text x={-35} y={-13} fontSize={11} fontWeight={900} fontFamily="'Archivo', sans-serif" fill="#111111" textAnchor="middle">
                1 PERSON
              </text>

              {/* OCCUPIED Green Badge */}
              <rect x={20} y={-30} width={90} height={26} fill="#35C759" stroke="#111111" strokeWidth={2.5} />
              <text x={65} y={-13} fontSize={11} fontWeight={900} fontFamily="'Archivo', sans-serif" fill="#111111" textAnchor="middle">
                OCCUPIED
              </text>
            </g>
          )}
        </g>
      </g>
    </g>
  );
};
