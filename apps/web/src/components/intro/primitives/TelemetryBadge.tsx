import React from 'react';

export type TelemetryBadgeVariant =
  | 'TARGET_HARDWARE'
  | 'SAMPLE_VALUES'
  | 'LIVE_PROTOTYPE'
  | 'DEMO_SEQUENCE'
  | 'SIMULATED_SENSOR';

interface TelemetryBadgeProps {
  x: number;
  y: number;
  variant: TelemetryBadgeVariant;
  customText?: string;
  zoom?: number;
  opacity?: number;
}

export const TelemetryBadge: React.FC<TelemetryBadgeProps> = ({
  x,
  y,
  variant,
  customText,
  zoom = 1,
  opacity = 1,
}) => {
  if (opacity <= 0.05) return null;

  const invZ = 1 / (zoom || 1);

  let bg = '#F4F0E6';
  let borderDashed = false;
  let text = customText || 'TARGET HARDWARE';
  let textColor = '#111111';

  switch (variant) {
    case 'TARGET_HARDWARE':
      bg = '#F4F0E6';
      borderDashed = true;
      text = customText || 'TARGET HARDWARE';
      break;
    case 'SAMPLE_VALUES':
      bg = '#27C7E8';
      text = customText || 'SAMPLE VALUES';
      break;
    case 'LIVE_PROTOTYPE':
      bg = '#35C759';
      text = customText || 'LIVE PROTOTYPE INPUT';
      break;
    case 'DEMO_SEQUENCE':
      bg = '#FFD83D';
      text = customText || 'DEMO SEQUENCE · NOT LIVE';
      break;
    case 'SIMULATED_SENSOR':
      bg = '#E6E0D0';
      borderDashed = true;
      text = customText || 'SIMULATED SENSOR';
      break;
  }

  const width = text.length * 7.5 + 16;
  const height = 20;

  return (
    <g
      transform={`translate(${x}, ${y}) scale(${invZ})`}
      opacity={opacity}
      pointerEvents="none"
    >
      {/* Hard offset shadow */}
      <rect x={2} y={2} width={width} height={height} fill="#111111" />

      {/* Badge face */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={bg}
        stroke="#111111"
        strokeWidth={1.5}
        strokeDasharray={borderDashed ? '3 2' : 'none'}
      />

      {/* Text */}
      <text
        x={width / 2}
        y={13.5}
        fill={textColor}
        fontSize={9}
        fontWeight={700}
        fontFamily="'IBM Plex Mono', monospace"
        letterSpacing="0.06em"
        textAnchor="middle"
      >
        {text}
      </text>
    </g>
  );
};
