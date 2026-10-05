import React from 'react';

interface RelayModuleProps {
  label: string;
  isEnergized?: boolean;
  leverAngle?: number; // -22deg (ON) to +22deg (OFF)
  isMirrored?: boolean;
  className?: string;
}

export const RelayModule: React.FC<RelayModuleProps> = ({
  label,
  isEnergized = false,
  leverAngle = 22,
  isMirrored = false,
  className,
}) => {
  return (
    <g
      id={`relay-module-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={className}
      transform={isMirrored ? 'scale(-1, 1)' : undefined}
    >
      {/* Hard Offset Shadow */}
      <rect x={-130 + 10} y={-95 + 10} width={260} height={190} rx={6} fill="#111111" />

      {/* PCB Base */}
      <g id="relay__pcb">
        <rect
          x={-130}
          y={-95}
          width={260}
          height={190}
          rx={6}
          fill="#26262B"
          stroke="#111111"
          strokeWidth={5}
        />
        <rect
          x={-122}
          y={-87}
          width={244}
          height={174}
          rx={4}
          fill="none"
          stroke="#F4F0E6"
          strokeWidth={1.5}
          opacity={0.3}
        />
      </g>

      {/* Blue Relay Cube (Songle SRD style) */}
      <g id="relay__cube" transform="translate(10, 0)">
        <rect
          x={-65}
          y={-65}
          width={130}
          height={130}
          rx={4}
          fill="#356AE6"
          stroke="#111111"
          strokeWidth={4}
        />
        {/* Cube Branding & Rating Details */}
        <text
          x={0}
          y={-40}
          fontSize={11}
          fontWeight={900}
          fontFamily="'Archivo', sans-serif"
          fill="#F4F0E6"
          textAnchor="middle"
          letterSpacing="0.08em"
        >
          {label}
        </text>
        <text
          x={0}
          y={-22}
          fontSize={8}
          fontWeight={700}
          fontFamily="'IBM Plex Mono', monospace"
          fill="#FFD83D"
          textAnchor="middle"
        >
          SRD-05VDC · 10A 250VAC
        </text>

        {/* Schematic Armature Lever (Flips ON/OFF) */}
        <g id="relay__lever" transform="translate(0, 15)">
          {/* Base pivot circle */}
          <circle cx={-25} cy={0} r={4} fill="#F4F0E6" stroke="#111111" strokeWidth={1.5} />
          {/* Contact terminals */}
          <circle cx={25} cy={-12} r={3} fill="#FFD83D" stroke="#111111" strokeWidth={1.5} />
          <circle cx={25} cy={12} r={3} fill="#CFCABC" stroke="#111111" strokeWidth={1.5} />
          {/* Moving Armature Line */}
          <line
            x1={-25}
            y1={0}
            x2={22}
            y2={0}
            stroke="#F4F0E6"
            strokeWidth={3.5}
            strokeLinecap="round"
            transform={`rotate(${leverAngle}, -25, 0)`}
          />
        </g>

        {/* Status indicator on cube */}
        <rect x={-45} y={42} width={90} height={14} fill="#111111" opacity={0.3} rx={2} />
        <text
          x={0}
          y={52}
          fontSize={8}
          fontWeight={700}
          fontFamily="'IBM Plex Mono', monospace"
          fill={isEnergized ? '#35C759' : '#CFCABC'}
          textAnchor="middle"
        >
          {isEnergized ? 'COIL: ENERGIZED' : 'COIL: IDLE'}
        </text>
      </g>

      {/* 3-Position Blue Screw Terminal Block (Load Connections) */}
      <g id="relay__terminals" transform="translate(-100, 0)">
        <rect
          x={-24}
          y={-60}
          width={48}
          height={120}
          rx={4}
          fill="#356AE6"
          stroke="#111111"
          strokeWidth={4}
        />
        {/* Three Metal Screw Holes with Slots */}
        {[-36, 0, 36].map((sy, i) => (
          <g key={`screw-${i}`} transform={`translate(0, ${sy})`}>
            <circle cx={0} cy={0} r={10} fill="#CFCABC" stroke="#111111" strokeWidth={2} />
            <line x1={-6} y1={-3} x2={6} y2={3} stroke="#111111" strokeWidth={2.5} />
          </g>
        ))}
      </g>

      {/* 3-Pin Input Control Header (VCC, GND, IN) Top */}
      <g id="relay__inHeader" transform="translate(0, -90)">
        {[-20, 0, 20].map((px, i) => (
          <g key={`in-${i}`} transform={`translate(${px}, 0)`}>
            <rect x={-5} y={-4} width={10} height={12} fill="#FFD83D" stroke="#111111" strokeWidth={1.5} />
            <circle cx={0} cy={2} r={2.5} fill="#111111" />
          </g>
        ))}
      </g>

      {/* Coil Activation LED */}
      <g id="relay__led" transform="translate(85, -50)">
        <circle cx={0} cy={0} r={5} fill={isEnergized ? '#E53935' : '#441111'} stroke="#111111" strokeWidth={1.5} />
      </g>
    </g>
  );
};
