import React, { useRef, useState } from 'react';
import { useTrack } from '../../engine/useTrack';
import { W, seg } from '../../engine/timeline';
import { outCubic } from '../../engine/easing';

interface Error404SceneProps {
  zoom?: number;
}

export const Error404Scene: React.FC<Error404SceneProps> = ({ zoom = 1 }) => {
  const groupRef = useRef<SVGGElement>(null);
  const [rebootBarProg, setRebootBarProg] = useState(0);

  useTrack((p) => {
    // Visible only in theatrical 404 & reboot transition (88.0 -> 90.5)
    if (p < 88.0 || p > 90.5) {
      if (groupRef.current) groupRef.current.setAttribute('visibility', 'hidden');
      return;
    }
    if (groupRef.current) groupRef.current.setAttribute('visibility', 'visible');

    // Reboot bar slides across screen 89.5 -> 90.0
    const rProg = seg(p, W.rebootBar[0], W.rebootBar[1], outCubic);
    setRebootBarProg(rProg);
  });

  const invZ = 1 / (zoom || 1);

  if (rebootBarProg <= 0.01) return null;

  // Banner slides horizontally across the viewport at monitor level (y = 1900)
  const barWidth = 1000;
  const slideX = -1200 + rebootBarProg * 1200;

  return (
    <g ref={groupRef} id="scene-12-theatrical-404" transform="translate(1200, 1900)">
      <g transform={`translate(${slideX}, 180) scale(${invZ})`} pointerEvents="none">
        {/* Hard Shadow */}
        <rect x={-barWidth / 2 + 8} y={-24 + 8} width={barWidth} height={52} fill="#111111" />
        {/* Banner plate */}
        <rect
          x={-barWidth / 2}
          y={-24}
          width={barWidth}
          height={52}
          fill="#FFD83D"
          stroke="#111111"
          strokeWidth={4}
        />
        {/* Text */}
        <text
          x={0}
          y={10}
          fontSize={18}
          fontWeight={900}
          fontFamily="'Archivo', sans-serif"
          fill="#111111"
          textAnchor="middle"
          letterSpacing="0.12em"
        >
          SYSTEM REBOOT INITIATED · ENGAGING FAILSAFE MODE
        </text>
      </g>
    </g>
  );
};
