import React from 'react';

interface PulseRingProps {
  cx: number;
  cy: number;
  progress: number; // 0 to 1
  color?: string;
  maxRadius?: number;
}

export const PulseRing: React.FC<PulseRingProps> = ({
  cx,
  cy,
  progress,
  color = '#FFD83D',
  maxRadius = 46,
}) => {
  if (progress <= 0 || progress >= 1) return null;

  const r = 8 + (maxRadius - 8) * progress;
  const opacity = 1 - progress;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke={color}
      strokeWidth={3}
      opacity={opacity}
      pointerEvents="none"
    />
  );
};
