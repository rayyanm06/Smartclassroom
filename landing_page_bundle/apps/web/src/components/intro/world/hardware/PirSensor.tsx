import React from 'react';

interface PirSensorProps {
  motionActive?: boolean;
  velocityTicks?: number; // 0 to 1 for trailing ink ticks
  className?: string;
}

export const PirSensor: React.FC<PirSensorProps> = ({
  motionActive = false,
  velocityTicks = 0,
  className,
}) => {
  return (
    <g id="pir-sensor" className={className}>
      {/* Velocity Motion Ticks (trailing to the left during entrance) */}
      {velocityTicks > 0.1 && (
        <g opacity={Math.min(1, velocityTicks * 1.5)}>
          <line x1={-130} y1={-40} x2={-170} y2={-40} stroke="#111111" strokeWidth={3} strokeLinecap="round" />
          <line x1={-140} y1={0} x2={-195} y2={0} stroke="#111111" strokeWidth={4} strokeLinecap="round" />
          <line x1={-130} y1={40} x2={-170} y2={40} stroke="#111111" strokeWidth={3} strokeLinecap="round" />
        </g>
      )}

      {/* Hard Offset Shadow */}
      <rect x={-110 + 10} y={-130 + 10} width={220} height={260} rx={6} fill="#111111" />

      {/* PCB Base */}
      <g id="pir__pcb">
        <rect
          x={-110}
          y={-130}
          width={220}
          height={260}
          rx={6}
          fill="#26262B"
          stroke="#111111"
          strokeWidth={5}
        />
        {/* Inset keyline */}
        <rect
          x={-102}
          y={-122}
          width={204}
          height={244}
          rx={4}
          fill="none"
          stroke="#F4F0E6"
          strokeWidth={1.5}
          opacity={0.3}
        />
      </g>

      {/* White Fresnel Motion Dome */}
      <g id="pir__dome" transform="translate(0, -25)">
        {/* Outer Circular Rim */}
        <circle cx={0} cy={0} r={74} fill="#CFCABC" stroke="#111111" strokeWidth={4} />
        {/* Faceted Dome Body */}
        <circle cx={0} cy={0} r={66} fill="#FBF8F0" stroke="#111111" strokeWidth={3} />
        {/* Geometric Hex/Honeycomb Facet Lines */}
        <polygon
          points="0,-50 43,-25 43,25 0,50 -43,25 -43,-25"
          fill="none"
          stroke="#111111"
          strokeWidth={2}
          opacity={0.4}
        />
        <polygon
          points="0,-28 24,-14 24,14 0,28 -24,14 -24,-14"
          fill={motionActive ? '#FFD83D' : '#FBF8F0'}
          stroke="#111111"
          strokeWidth={2.5}
        />
        {/* Radial Facet Division Lines */}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <line
            key={`facet-${deg}`}
            x1={0}
            y1={-28}
            x2={0}
            y2={-66}
            stroke="#111111"
            strokeWidth={1.5}
            opacity={0.4}
            transform={`rotate(${deg})`}
          />
        ))}
      </g>

      {/* Two Yellow Trim-Potentiometers (Bottom Left) */}
      <g id="pir__pots" transform="translate(-40, 75)">
        <rect x={-20} y={-16} width={40} height={32} fill="#FFD83D" stroke="#111111" strokeWidth={2.5} />
        <circle cx={0} cy={0} r={10} fill="#CFCABC" stroke="#111111" strokeWidth={2} />
        <line x1={-7} y1={0} x2={7} y2={0} stroke="#111111" strokeWidth={2} />
        <text x={0} y={26} fontSize={8} fontWeight={700} fontFamily="'IBM Plex Mono', monospace" fill="#F4F0E6" textAnchor="middle">
          TIME
        </text>
      </g>
      <g id="pir__pots-sens" transform="translate(25, 75)">
        <rect x={-20} y={-16} width={40} height={32} fill="#FFD83D" stroke="#111111" strokeWidth={2.5} />
        <circle cx={0} cy={0} r={10} fill="#CFCABC" stroke="#111111" strokeWidth={2} />
        <line x1={0} y1={-7} x2={0} y2={7} stroke="#111111" strokeWidth={2} />
        <text x={0} y={26} fontSize={8} fontWeight={700} fontFamily="'IBM Plex Mono', monospace" fill="#F4F0E6" textAnchor="middle">
          SENS
        </text>
      </g>

      {/* 3-Pin Header (Right Edge: VCC, OUT, GND) */}
      <g id="pir__pins" transform="translate(110, 40)">
        {[-30, 0, 30].map((py, i) => (
          <g key={`pin-${i}`} transform={`translate(0, ${py})`}>
            <rect x={-4} y={-5} width={14} height={10} fill="#FFD83D" stroke="#111111" strokeWidth={1.5} />
            <circle cx={3} cy={0} r={2.5} fill="#111111" />
          </g>
        ))}
      </g>
    </g>
  );
};
