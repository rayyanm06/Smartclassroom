import React, { useRef, useEffect, useState } from 'react';

interface DataPacketProps {
  text: string;
  pathD: string;
  u: number; // 0 to 1 progress along wire
  fill?: string;
  textColor?: string;
  zoom?: number;
  visible?: boolean;
}

export const DataPacket: React.FC<DataPacketProps> = ({
  text,
  pathD,
  u,
  fill = '#27C7E8',
  textColor = '#111111',
  zoom = 1,
  visible = true,
}) => {
  const pathRef = useRef<SVGPathElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!pathRef.current) return;
    try {
      const len = pathRef.current.getTotalLength();
      const clampedU = Math.max(0, Math.min(1, u));
      const pt = pathRef.current.getPointAtLength(clampedU * len);
      setPos({ x: pt.x, y: pt.y });
    } catch {
      // Fallback
    }
  }, [u, pathD]);

  if (!visible || u <= 0 || u >= 1) return null;

  // Scale pop: 0 -> 1 in first 8%, 1 -> 0 in last 10%
  let scale = 1;
  if (u < 0.08) scale = u / 0.08;
  else if (u > 0.90) scale = (1 - u) / 0.10;

  const width = Math.max(80, text.length * 9.5 + 24);
  const height = 30;
  const invZ = 1 / (zoom || 1);

  return (
    <>
      {/* Hidden reference path to query getPointAtLength */}
      <path ref={pathRef} d={pathD} fill="none" stroke="none" pointerEvents="none" />

      <g
        transform={`translate(${pos.x + 10}, ${pos.y - 26}) scale(${invZ * scale})`}
        pointerEvents="none"
      >
        {/* Hard offset shadow */}
        <rect
          x={4}
          y={4}
          width={width}
          height={height}
          fill="#111111"
        />

        {/* Packet face */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={fill}
          stroke="#111111"
          strokeWidth={3}
        />

        {/* Label text */}
        <text
          x={width / 2}
          y={height / 2 + 5}
          fill={textColor}
          fontSize={13}
          fontWeight={700}
          fontFamily="'IBM Plex Mono', monospace"
          textAnchor="middle"
          letterSpacing="0.05em"
        >
          {text}
        </text>
      </g>
    </>
  );
};
