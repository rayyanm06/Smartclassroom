import React from 'react';

interface Esp32BoardProps {
  activationProgress?: number; // 0 to 1 for yellow plate & power rays
  txLedBlink?: boolean;
  powerLedOn?: boolean;
  className?: string;
}

export const Esp32Board: React.FC<Esp32BoardProps> = ({
  activationProgress = 0,
  txLedBlink = false,
  powerLedOn = false,
  className,
}) => {
  const isActivated = activationProgress > 0.1;
  const plateScale = Math.min(1, 0.6 + activationProgress * 0.4);

  return (
    <g id="esp32-board" className={className}>
      {/* 1. Yellow Power Activation Plate (behind board offset -14, -14) */}
      {activationProgress > 0.05 && (
        <g
          id="esp32__plate"
          transform={`translate(-14, -14) scale(${plateScale})`}
          opacity={Math.min(1, activationProgress * 2)}
        >
          {/* Hard offset shadow */}
          <rect x={12} y={12} width={280} height={480} rx={0} fill="#111111" />
          <rect
            x={-140}
            y={-240}
            width={280}
            height={480}
            fill="#FFD83D"
            stroke="#111111"
            strokeWidth={4}
          />
        </g>
      )}

      {/* 2. Eight Hard-Edged Activation Rays (kick out 15.3 -> 17) */}
      {activationProgress > 0.2 && activationProgress < 0.95 && (
        <g opacity={Math.sin(activationProgress * Math.PI)}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <polygon
              key={`ray-${deg}`}
              points="0,-230 18,-290 -18,-290"
              fill="#FFD83D"
              stroke="#111111"
              strokeWidth={3}
              transform={`rotate(${deg})`}
            />
          ))}
        </g>
      )}

      {/* 3. Hard Shadow of the ESP32 Board */}
      <rect x={-120 + 12} y={-220 + 12} width={240} height={440} rx={8} fill="#111111" />

      {/* 4. Dark PCB Body with Inset Keyline */}
      <g id="esp32__pcb">
        <rect
          x={-120}
          y={-220}
          width={240}
          height={440}
          rx={8}
          fill="#26262B"
          stroke="#111111"
          strokeWidth={6}
        />
        {/* Inset paper keyline for visual definition against shadow */}
        <rect
          x={-112}
          y={-212}
          width={224}
          height={424}
          rx={5}
          fill="none"
          stroke="#F4F0E6"
          strokeWidth={2}
          opacity={0.3}
        />
        {/* Corner Mounting Holes */}
        {[[-100, -200], [100, -200], [-100, 200], [100, 200]].map(([hx, hy], i) => (
          <g key={`hole-${i}`} transform={`translate(${hx}, ${hy})`}>
            <circle cx={0} cy={0} r={8} fill="#F4F0E6" stroke="#111111" strokeWidth={2} />
            <circle cx={0} cy={0} r={5} fill="#26262B" />
          </g>
        ))}
      </g>

      {/* 5. Left and Right Gold Pin Headers (19 pads each) */}
      <g id="esp32__pinsL">
        {Array.from({ length: 19 }).map((_, i) => {
          const py = -180 + i * 20;
          return (
            <g key={`pinL-${i}`} transform={`translate(-108, ${py})`}>
              <rect x={-8} y={-6} width={16} height={12} fill="#FFD83D" stroke="#111111" strokeWidth={2} />
              <circle cx={0} cy={0} r={3} fill="#111111" />
            </g>
          );
        })}
      </g>
      <g id="esp32__pinsR">
        {Array.from({ length: 19 }).map((_, i) => {
          const py = -180 + i * 20;
          return (
            <g key={`pinR-${i}`} transform={`translate(108, ${py})`}>
              <rect x={-8} y={-6} width={16} height={12} fill="#FFD83D" stroke="#111111" strokeWidth={2} />
              <circle cx={0} cy={0} r={3} fill="#111111" />
            </g>
          );
        })}
      </g>

      {/* 6. Meander Antenna Trace (Top) */}
      <g id="esp32__antenna" transform="translate(0, -180)">
        <rect x={-70} y={-35} width={140} height={30} fill="#1A1A1E" stroke="#111111" strokeWidth={2} />
        {/* Copper Meander Wave */}
        <path
          d="M-60 -20 H-40 V-10 H-20 V-30 H0 V-10 H20 V-30 H40 V-10 H60"
          fill="none"
          stroke="#FFD83D"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* 7. Metal RF Shield Can Module */}
      <g id="esp32__shield" transform="translate(0, -70)">
        <rect
          x={-75}
          y={-70}
          width={150}
          height={140}
          rx={4}
          fill="#CFCABC"
          stroke="#111111"
          strokeWidth={5}
        />
        {/* ESP-WROOM-32 Silkscreen Text */}
        <rect x={-60} y={-50} width={120} height={18} fill="#111111" opacity={0.15} />
        <text
          x={0}
          y={-37}
          fontSize={12}
          fontWeight={900}
          fontFamily="'Archivo', sans-serif"
          fill="#111111"
          textAnchor="middle"
          letterSpacing="0.08em"
        >
          ESP-WROOM-32
        </text>
        <text
          x={0}
          y={-18}
          fontSize={8}
          fontWeight={700}
          fontFamily="'IBM Plex Mono', monospace"
          fill="#555555"
          textAnchor="middle"
        >
          Wi-Fi + BT DUAL-CORE
        </text>
        {/* FCC / CE Symbol Marks */}
        <rect x={-50} y={0} width={100} height={2} fill="#111111" opacity={0.4} />
      </g>

      {/* 8. USB Port (Bottom Edge) */}
      <g id="esp32__usb" transform="translate(0, 205)">
        <rect
          x={-28}
          y={-10}
          width={56}
          height={32}
          rx={4}
          fill="#CFCABC"
          stroke="#111111"
          strokeWidth={4}
        />
        <rect x={-18} y={4} width={36} height={12} rx={2} fill="#111111" />
      </g>

      {/* 9. USB Controller IC (CP2102) & Reset/Boot Buttons */}
      <rect x={-22} y={130} width={44} height={44} fill="#111111" stroke="#F4F0E6" strokeWidth={1} />
      {/* Tactile buttons */}
      <rect x={-80} y={180} width={24} height={20} fill="#CFCABC" stroke="#111111" strokeWidth={2} />
      <circle cx={-68} cy={190} r={4} fill="#FFD83D" />
      <rect x={56} y={180} width={24} height={20} fill="#CFCABC" stroke="#111111" strokeWidth={2} />
      <circle cx={68} cy={190} r={4} fill="#FFD83D" />

      {/* 10. Status LEDs (Power Red + TX Blue) */}
      <g id="esp32__ledPower" transform="translate(-40, 80)">
        <rect x={-5} y={-8} width={10} height={16} fill="#333333" stroke="#111111" strokeWidth={1.5} />
        <circle cx={0} cy={0} r={4} fill={isActivated || powerLedOn ? '#E53935' : '#441111'} />
      </g>
      <g id="esp32__ledTx" transform="translate(40, 80)">
        <rect x={-5} y={-8} width={10} height={16} fill="#333333" stroke="#111111" strokeWidth={1.5} />
        <circle cx={0} cy={0} r={4} fill={txLedBlink ? '#27C7E8' : '#112233'} />
      </g>
    </g>
  );
};
