import React from 'react';

export const BlueprintBackground: React.FC = () => {
  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full block"
      >
        <defs>
          {/* Minor 24px grid */}
          <pattern id="e-grid-minor" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#111111" strokeWidth="1" strokeOpacity="0.07" />
          </pattern>

          {/* Major 120px grid */}
          <pattern id="e-grid-major" width="120" height="120" patternUnits="userSpaceOnUse">
            <rect width="120" height="120" fill="url(#e-grid-minor)" />
            <path d="M 120 0 L 0 0 0 120" fill="none" stroke="#111111" strokeWidth="1" strokeOpacity="0.16" />
          </pattern>
        </defs>

        {/* Paper base fill */}
        <rect width="100%" height="100%" fill="#F4F0E6" />

        {/* Technical drafting grid */}
        <rect width="100%" height="100%" fill="url(#e-grid-major)" />

        {/* 4 Corner Registration Marks (inset 20px) */}
        {/* Top-Left */}
        <g transform="translate(20, 20)" stroke="#111111" strokeWidth="1.5" strokeOpacity="0.5">
          <circle cx="12" cy="12" r="10" fill="none" />
          <line x1="12" y1="0" x2="12" y2="24" />
          <line x1="0" y1="12" x2="24" y2="12" />
        </g>
        {/* Top-Right */}
        <g transform="translate(calc(100% - 44px), 20)" stroke="#111111" strokeWidth="1.5" strokeOpacity="0.5">
          <circle cx="12" cy="12" r="10" fill="none" />
          <line x1="12" y1="0" x2="12" y2="24" />
          <line x1="0" y1="12" x2="24" y2="12" />
        </g>
        {/* Bottom-Left */}
        <g transform="translate(20, calc(100% - 44px))" stroke="#111111" strokeWidth="1.5" strokeOpacity="0.5">
          <circle cx="12" cy="12" r="10" fill="none" />
          <line x1="12" y1="0" x2="12" y2="24" />
          <line x1="0" y1="12" x2="24" y2="12" />
        </g>
        {/* Bottom-Right */}
        <g transform="translate(calc(100% - 44px), calc(100% - 44px))" stroke="#111111" strokeWidth="1.5" strokeOpacity="0.5">
          <circle cx="12" cy="12" r="10" fill="none" />
          <line x1="12" y1="0" x2="12" y2="24" />
          <line x1="0" y1="12" x2="24" y2="12" />
        </g>

        {/* Margin-only Ruler Ticks along Top (0 to 1200px) */}
        <g stroke="#111111" strokeOpacity="0.4" strokeWidth="1" fontFamily="'IBM Plex Mono', monospace" fontSize="8" fill="#111111" fillOpacity="0.45">
          {Array.from({ length: 16 }).map((_, i) => {
            const x = i * 120;
            return (
              <g key={`rt-${i}`}>
                <line x1={x} y1="0" x2={x} y2="14" strokeWidth="1.5" />
                <text x={x + 3} y="11">{x}</text>
                <line x1={x + 24} y1="0" x2={x + 24} y2="6" />
                <line x1={x + 48} y1="0" x2={x + 48} y2="6" />
                <line x1={x + 72} y1="0" x2={x + 72} y2="6" />
                <line x1={x + 96} y1="0" x2={x + 96} y2="6" />
              </g>
            );
          })}
        </g>

        {/* Margin-only Ruler Ticks along Left (0 to 900px) */}
        <g stroke="#111111" strokeOpacity="0.4" strokeWidth="1" fontFamily="'IBM Plex Mono', monospace" fontSize="8" fill="#111111" fillOpacity="0.45">
          {Array.from({ length: 10 }).map((_, i) => {
            const y = i * 120;
            return (
              <g key={`rl-${i}`}>
                <line x1="0" y1={y} x2="14" y2={y} strokeWidth="1.5" />
                <text x="3" y={y + 11}>{y}</text>
                <line x1="0" y1={y + 24} x2="6" y2={y + 24} />
                <line x1="0" y1={y + 48} x2="6" y2={y + 48} />
                <line x1="0" y1={y + 72} x2="6" y2={y + 72} />
                <line x1="0" y1={y + 96} x2="6" y2={y + 96} />
              </g>
            );
          })}
        </g>

        {/* Margin-only Schematic Symbols (Left & Right margins) */}
        {/* Resistor in left margin */}
        <g transform="translate(18, 220)" stroke="#111111" strokeWidth="1.5" strokeOpacity="0.22" fill="none">
          <path d="M 0 0 L 0 10 L 8 14 L -8 22 L 8 30 L -8 38 L 8 46 L 0 50 L 0 60" />
        </g>
        {/* Capacitor in left margin */}
        <g transform="translate(18, 360)" stroke="#111111" strokeWidth="1.5" strokeOpacity="0.22" fill="none">
          <line x1="0" y1="0" x2="0" y2="18" />
          <line x1="-10" y1="18" x2="10" y2="18" />
          <line x1="-10" y1="24" x2="10" y2="24" />
          <line x1="0" y1="24" x2="0" y2="42" />
        </g>
        {/* Ground in left margin */}
        <g transform="translate(18, 480)" stroke="#111111" strokeWidth="1.5" strokeOpacity="0.22" fill="none">
          <line x1="0" y1="0" x2="0" y2="18" />
          <line x1="-12" y1="18" x2="12" y2="18" />
          <line x1="-8" y1="22" x2="8" y2="22" />
          <line x1="-4" y1="26" x2="4" y2="26" />
        </g>
        {/* Diode in right margin */}
        <g transform="translate(calc(100% - 24px), 240)" stroke="#111111" strokeWidth="1.5" strokeOpacity="0.22" fill="none">
          <line x1="0" y1="0" x2="0" y2="16" />
          <polygon points="-8,16 8,16 0,30" fill="#111111" fillOpacity="0.15" />
          <line x1="-8" y1="30" x2="8" y2="30" />
          <line x1="0" y1="30" x2="0" y2="46" />
        </g>
        {/* Inductor in right margin */}
        <g transform="translate(calc(100% - 24px), 380)" stroke="#111111" strokeWidth="1.5" strokeOpacity="0.22" fill="none">
          <path d="M 0 0 V 10 C -10 10 -10 20 0 20 C -10 20 -10 30 0 30 C -10 30 -10 40 0 40 V 50" />
        </g>

        {/* Title Block in bottom-right margin */}
        <g transform="translate(calc(100% - 230px), calc(100% - 55px))">
          <rect x="0" y="0" width="210" height="42" fill="#F4F0E6" stroke="#111111" strokeWidth="1.5" strokeOpacity="0.4" />
          <text x="8" y="14" fontFamily="'IBM Plex Mono', monospace" fontSize="8.5" fontWeight="700" fill="#111111" fillOpacity="0.6">
            DWG · SMART CLASSROOM · ROOM 508
          </text>
          <text x="8" y="26" fontFamily="'IBM Plex Mono', monospace" fontSize="8" fill="#111111" fillOpacity="0.45">
            SHEET 01 OF 01 · NOT TO SCALE
          </text>
          <text x="8" y="36" fontFamily="'IBM Plex Mono', monospace" fontSize="7" fill="#111111" fillOpacity="0.35">
            ARCHITECTURAL SCHEMATIC SPECIFICATION
          </text>
        </g>
      </svg>
    </div>
  );
};
