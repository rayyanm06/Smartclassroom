import React from 'react';

interface TechnicalLabelProps {
  targetX: number;
  targetY: number;
  labelX: number;
  labelY: number;
  text: string;
  subtext?: string;
  drawProgress?: number; // 0 to 1
  zoom?: number;
  accent?: string;
}

export const TechnicalLabel: React.FC<TechnicalLabelProps> = ({
  targetX,
  targetY,
  labelX,
  labelY,
  text,
  subtext,
  drawProgress = 1,
  zoom = 1,
  accent = '#111111',
}) => {
  if (drawProgress <= 0.05) return null;

  const invZ = 1 / (zoom || 1);
  const opacity = Math.min(1, drawProgress * 2);

  // Leader line coordinates
  const leaderD = `M${targetX} ${targetY} L${labelX} ${labelY}`;

  return (
    <g opacity={opacity} pointerEvents="none">
      {/* Target indicator dot */}
      <circle cx={targetX} cy={targetY} r={4 * invZ} fill={accent} stroke="#111111" strokeWidth={1.5} />

      {/* Leader line */}
      <path
        d={leaderD}
        fill="none"
        stroke="#111111"
        strokeWidth={2 * invZ}
        strokeDasharray="4 3"
      />

      {/* Counter-scaled label container */}
      <g transform={`translate(${labelX}, ${labelY}) scale(${invZ})`}>
        {/* Shadow */}
        <rect
          x={3}
          y={3}
          width={Math.max(90, text.length * 9 + 20)}
          height={subtext ? 36 : 24}
          fill="#111111"
        />

        {/* Plate */}
        <rect
          x={0}
          y={0}
          width={Math.max(90, text.length * 9 + 20)}
          height={subtext ? 36 : 24}
          fill="#F4F0E6"
          stroke="#111111"
          strokeWidth={2}
        />

        {/* Main Text */}
        <text
          x={10}
          y={subtext ? 16 : 16}
          fill="#111111"
          fontSize={11}
          fontWeight={700}
          fontFamily="'IBM Plex Mono', monospace"
          letterSpacing="0.08em"
        >
          {text}
        </text>

        {/* Subtext if present */}
        {subtext && (
          <text
            x={10}
            y={29}
            fill="#555555"
            fontSize={9}
            fontWeight={600}
            fontFamily="'IBM Plex Mono', monospace"
          >
            {subtext}
          </text>
        )}
      </g>
    </g>
  );
};
