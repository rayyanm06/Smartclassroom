import React, { useId } from 'react';

interface WirePathProps {
  d: string;
  progress: number; // 0 to 1
  outerWidth?: number;
  coreWidth?: number;
  coreColor?: string;
  hasCore?: boolean;
  plugStart?: boolean;
  plugEnd?: boolean;
  plugProgress?: number; // 0 to 1 for plug pop
  haloColor?: string;
  dashed?: boolean;
  dashOffset?: number;
  className?: string;
}

export const WirePath: React.FC<WirePathProps> = ({
  d,
  progress,
  outerWidth = 14,
  coreWidth = 6,
  coreColor = '#FFD83D',
  hasCore = true,
  plugStart = false,
  plugEnd = false,
  plugProgress = 1,
  haloColor = '#F4F0E6',
  dashed = false,
  dashOffset = 0,
  className,
}) => {
  const id = useId();
  const clampedP = Math.max(0, Math.min(1, progress));
  const isVisible = clampedP > 0.001;

  if (!isVisible && !plugStart) {
    return null;
  }

  const offset = 1 - clampedP;

  return (
    <g className={className} id={`wire-${id}`}>
      {/* 1. Paper Halo for auto-bridging wire crossings */}
      {clampedP > 0.05 && (
        <path
          d={d}
          fill="none"
          stroke={haloColor}
          strokeWidth={outerWidth + 8}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={offset}
        />
      )}

      {/* 2. Outer Ink Stroke */}
      <path
        d={d}
        fill="none"
        stroke="#111111"
        strokeWidth={outerWidth}
        strokeLinecap="butt"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={offset}
      />

      {/* 3. Core Color (Signal / Active Voltage) */}
      {hasCore && (
        <path
          d={d}
          fill="none"
          stroke={coreColor}
          strokeWidth={coreWidth}
          strokeLinecap="butt"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={dashed ? '18 22' : '1 1'}
          strokeDashoffset={dashed ? dashOffset : offset}
        />
      )}

      {/* 4. Plugs (Dupont Connector Rectangles at Ends) */}
      {plugEnd && clampedP >= 0.95 && (
        <g opacity={Math.min(1, plugProgress * 2)}>
          <circle cx={0} cy={0} r={outerWidth * 0.7} fill="#111111" />
        </g>
      )}
    </g>
  );
};
