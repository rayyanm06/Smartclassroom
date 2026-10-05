import React from 'react';

interface Dht11SensorProps {
  velocityTicks?: number;
  className?: string;
}

export const Dht11Sensor: React.FC<Dht11SensorProps> = ({
  velocityTicks = 0,
  className,
}) => {
  return (
    <g id="dht11-sensor" className={className}>
      {/* Velocity Ticks (trailing to the right during entrance) */}
      {velocityTicks > 0.1 && (
        <g opacity={Math.min(1, velocityTicks * 1.5)}>
          <line x1={110} y1={-30} x2={150} y2={-30} stroke="#111111" strokeWidth={3} strokeLinecap="round" />
          <line x1={120} y1={0} x2={175} y2={0} stroke="#111111" strokeWidth={4} strokeLinecap="round" />
          <line x1={110} y1={30} x2={150} y2={30} stroke="#111111" strokeWidth={3} strokeLinecap="round" />
        </g>
      )}

      {/* Hard Offset Shadow */}
      <rect x={-90 + 10} y={-100 + 10} width={180} height={200} rx={6} fill="#111111" />

      {/* Breakout PCB (Bottom Layer) */}
      <g id="dht__breakout">
        <rect
          x={-90}
          y={40}
          width={180}
          height={60}
          rx={4}
          fill="#26262B"
          stroke="#111111"
          strokeWidth={4}
        />
        {/* Pull-up Resistor & Decoupling Cap */}
        <rect x={-40} y={55} width={22} height={12} fill="#333" stroke="#F4F0E6" strokeWidth={1} />
        <rect x={20} y={55} width={16} height={12} fill="#CFCABC" stroke="#111111" strokeWidth={1} />
      </g>

      {/* Blue Perforated Plastic Body */}
      <g id="dht__body">
        <rect
          x={-75}
          y={-90}
          width={150}
          height={135}
          rx={6}
          fill="#356AE6"
          stroke="#111111"
          strokeWidth={5}
        />
        {/* Silkscreen text */}
        <rect x={-60} y={-80} width={120} height={14} fill="#111111" opacity={0.2} />
        <text
          x={0}
          y={-69}
          fontSize={10}
          fontWeight={900}
          fontFamily="'Archivo', sans-serif"
          fill="#F4F0E6"
          textAnchor="middle"
          letterSpacing="0.08em"
        >
          DHT11 HUMIDITY
        </text>

        {/* 4 x 6 Grid of Ventilation Sensing Slots */}
        <g id="dht__slots" transform="translate(-48, -50)">
          {Array.from({ length: 4 }).map((_, col) => (
            <g key={`dht-col-${col}`} transform={`translate(${col * 28}, 0)`}>
              {Array.from({ length: 5 }).map((__, row) => (
                <rect
                  key={`slot-${col}-${row}`}
                  x={0}
                  y={row * 15}
                  width={14}
                  height={8}
                  rx={2}
                  fill="#111111"
                />
              ))}
            </g>
          ))}
        </g>
      </g>

      {/* 4 Header Connector Legs on Left Edge (VCC, DATA, NC, GND) */}
      <g id="dht__legs" transform="translate(-90, 0)">
        {[-30, 0, 30].map((py, i) => (
          <g key={`dht-leg-${i}`} transform={`translate(-4, ${py})`}>
            <rect x={-8} y={-5} width={16} height={10} fill="#FFD83D" stroke="#111111" strokeWidth={1.5} />
            <circle cx={0} cy={0} r={2.5} fill="#111111" />
          </g>
        ))}
      </g>
    </g>
  );
};
