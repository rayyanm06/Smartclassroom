import React from 'react';

interface HardShadowProps {
  href: string;
  dx?: number;
  dy?: number;
  opacity?: number;
}

export const HardShadow: React.FC<HardShadowProps> = ({
  href,
  dx = 12,
  dy = 12,
  opacity = 1,
}) => {
  return (
    <use
      href={href}
      x={dx}
      y={dy}
      fill="#111111"
      stroke="#111111"
      opacity={opacity}
      pointerEvents="none"
    />
  );
};
