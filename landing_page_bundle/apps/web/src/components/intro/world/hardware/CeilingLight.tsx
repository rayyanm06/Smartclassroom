import React from 'react';

interface CeilingLightProps {
  isOn?: boolean;
  intensity?: number; // 0 to 1
  className?: string;
}

export const CeilingLight: React.FC<CeilingLightProps> = ({
  isOn = false,
  intensity = 0,
  className,
}) => {
  const activeLevel = isOn ? Math.max(0.2, intensity) : 0;

  return (
    <g id="ceiling-light-fixture" className={className}>
      {/* 1. Radiating Hard Yellow Light Ray Polygons (ON state) */}
      {activeLevel > 0.05 && (
        <g opacity={activeLevel} transform="translate(0, 30)">
          <polygon
            points="-180,0 -260,160 260,160 180,0"
            fill="#FFD83D"
            opacity={0.35}
            stroke="#111111"
            strokeWidth={2}
          />
          {/* Individual beam rays */}
          {[-120, -60, 0, 60, 120].map((rx) => (
            <line
              key={`light-ray-${rx}`}
              x1={rx}
              y1={0}
              x2={rx * 1.5}
              y2={150}
              stroke="#FFD83D"
              strokeWidth={4}
              strokeLinecap="round"
            />
          ))}
        </g>
      )}

      {/* 2. Hard Offset Shadow */}
      <rect x={-200 + 10} y={-40 + 10} width={400} height={80} rx={4} fill="#111111" />

      {/* 3. Batten Enclosure Body */}
      <g id="light__body">
        <rect
          x={-200}
          y={-40}
          width={400}
          height={80}
          rx={4}
          fill={activeLevel > 0.5 ? '#FFD83D' : '#FBF8F0'}
          stroke="#111111"
          strokeWidth={5}
        />
        {/* End Caps */}
        <rect x={-200} y={-40} width={30} height={80} fill="#CFCABC" stroke="#111111" strokeWidth={3} />
        <rect x={170} y={-40} width={30} height={80} fill="#CFCABC" stroke="#111111" strokeWidth={3} />

        {/* Diffuser Tube Panel */}
        <rect
          x={-150}
          y={-15}
          width={300}
          height={35}
          rx={2}
          fill={activeLevel > 0.5 ? '#FFF8DC' : '#E6E0D0'}
          stroke="#111111"
          strokeWidth={3}
        />
        {/* Off State Hatching */}
        {activeLevel <= 0.05 && (
          <g opacity={0.3}>
            {[-120, -80, -40, 0, 40, 80, 120].map((hx) => (
              <line
                key={`hatch-${hx}`}
                x1={hx}
                y1={-15}
                x2={hx + 20}
                y2={20}
                stroke="#111111"
                strokeWidth={2}
              />
            ))}
          </g>
        )}

        {/* Technical Label */}
        <text
          x={0}
          y={-24}
          fontSize={10}
          fontWeight={900}
          fontFamily="'Archivo', sans-serif"
          fill="#111111"
          textAnchor="middle"
          letterSpacing="0.1em"
        >
          {isOn ? 'LIGHT: ON · 40W LED BATTEN' : 'LIGHT: OFF (SAVING ENERGY)'}
        </text>
      </g>

      {/* Top Load Wire Connector Pad */}
      <rect x={-15} y={-50} width={30} height={14} fill="#FFD83D" stroke="#111111" strokeWidth={2.5} />
    </g>
  );
};
