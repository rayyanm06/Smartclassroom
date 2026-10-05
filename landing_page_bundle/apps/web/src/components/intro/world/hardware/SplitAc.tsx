import React from 'react';

interface SplitAcProps {
  isOn?: boolean;
  flapAngle?: number; // 0 (closed/OFF) to -35deg (open/ON)
  streakProgress?: number; // 0 to 1 for cool air waves
  className?: string;
}

export const SplitAc: React.FC<SplitAcProps> = ({
  isOn = false,
  flapAngle = 0,
  streakProgress = 0,
  className,
}) => {
  return (
    <g id="split-ac-unit" className={className}>
      {/* 1. Cool Air Stream Waves (ON state) */}
      {isOn && (
        <g opacity={Math.min(1, streakProgress * 1.5)} transform="translate(0, 80)">
          {[-100, 0, 100].map((sx, i) => (
            <path
              key={`ac-streak-${i}`}
              d={`M${sx} 0 C${sx - 30} 40 ${sx + 30} 80 ${sx} 120`}
              fill="none"
              stroke="#27C7E8"
              strokeWidth={4}
              strokeDasharray="12 10"
              strokeLinecap="round"
            />
          ))}
        </g>
      )}

      {/* 2. Hard Offset Shadow */}
      <rect x={-200 + 10} y={-70 + 10} width={400} height={140} rx={6} fill="#111111" />

      {/* 3. Main AC Chassis Body */}
      <g id="ac__body">
        <rect
          x={-200}
          y={-70}
          width={400}
          height={140}
          rx={6}
          fill="#FBF8F0"
          stroke="#111111"
          strokeWidth={5}
        />
        {/* Subtle horizontal design groove */}
        <line x1={-180} y1={-20} x2={180} y2={-20} stroke="#111111" strokeWidth={2} opacity={0.3} />

        {/* Display Panel */}
        <g id="ac__display" transform="translate(110, -35)">
          <rect x={-30} y={-16} width={60} height={32} rx={3} fill="#111111" />
          <text
            x={0}
            y={5}
            fontSize={12}
            fontWeight={700}
            fontFamily="'IBM Plex Mono', monospace"
            fill={isOn ? '#27C7E8' : '#333'}
            textAnchor="middle"
          >
            {isOn ? '24°C' : '--'}
          </text>
        </g>

        {/* Status Indicator LED */}
        <g id="ac__led" transform="translate(155, -35)">
          <circle cx={0} cy={0} r={4} fill={isOn ? '#35C759' : '#333333'} stroke="#111111" strokeWidth={1} />
        </g>

        {/* Louvre Vent Chamber */}
        <rect x={-170} y={15} width={340} height={40} rx={3} fill="#26262B" stroke="#111111" strokeWidth={3} />

        {/* Movable Air Louver Flap */}
        <g id="ac__flap" transform="translate(0, 15)">
          <rect
            x={-165}
            y={0}
            width={330}
            height={16}
            rx={2}
            fill="#E6E0D0"
            stroke="#111111"
            strokeWidth={3}
            transform={`rotate(${flapAngle}, 0, 0)`}
          />
        </g>

        {/* Technical Label */}
        <text
          x={-40}
          y={-38}
          fontSize={10}
          fontWeight={900}
          fontFamily="'Archivo', sans-serif"
          fill="#111111"
          letterSpacing="0.08em"
        >
          {isOn ? 'AIR CONDITIONER: ON' : 'AIR CONDITIONER: OFF (IDLE)'}
        </text>
      </g>

      {/* Top Load Wire Connector Pad */}
      <rect x={-15} y={-80} width={30} height={14} fill="#FFD83D" stroke="#111111" strokeWidth={2.5} />
    </g>
  );
};
