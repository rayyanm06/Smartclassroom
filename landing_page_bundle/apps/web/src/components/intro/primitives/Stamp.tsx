import React from 'react';

interface StampProps {
  x: number;
  y: number;
  text: string;
  subtext?: string;
  fill?: string;
  textColor?: string;
  rotation?: number;
  scale?: number;
  opacity?: number;
  zoom?: number;
}

export const Stamp: React.FC<StampProps> = ({
  x,
  y,
  text,
  subtext,
  fill = '#FFD83D',
  textColor = '#111111',
  rotation = -4,
  scale = 1,
  opacity = 1,
  zoom = 1,
}) => {
  if (opacity <= 0.05) return null;

  const invZ = 1 / (zoom || 1);
  const width = Math.max(160, text.length * 11 + 36);
  const height = subtext ? 48 : 36;

  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${invZ * scale})`}
      opacity={opacity}
      pointerEvents="none"
    >
      {/* 6px hard offset shadow */}
      <rect
        x={-width / 2 + 6}
        y={-height / 2 + 6}
        width={width}
        height={height}
        fill="#111111"
      />

      {/* Stamp plate */}
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        fill={fill}
        stroke="#111111"
        strokeWidth={3}
      />

      {/* Text */}
      <text
        x={0}
        y={subtext ? -4 : 5}
        fill={textColor}
        fontSize={14}
        fontWeight={900}
        fontFamily="'Archivo', sans-serif"
        textAnchor="middle"
        letterSpacing="0.08em"
      >
        {text}
      </text>

      {subtext && (
        <text
          x={0}
          y={15}
          fill={textColor}
          fontSize={10}
          fontWeight={700}
          fontFamily="'IBM Plex Mono', monospace"
          textAnchor="middle"
          letterSpacing="0.05em"
        >
          {subtext}
        </text>
      )}
    </g>
  );
};
