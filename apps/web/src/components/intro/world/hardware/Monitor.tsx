import React from 'react';

interface MonitorProps {
  mode?: 'CONNECTING' | 'CHECKS' | 'CRACK' | '404' | 'REBOOT';
  checkProgress?: {
    sensors: boolean;
    esp32: boolean;
    camera: boolean;
    yolo: boolean;
    database: boolean;
  };
  crackProgress?: number; // 0 to 1
  glitchOffset?: number; // horizontal slice offset in px
  scanlineY?: number; // -300 to 300
  portsLit?: {
    relay1?: boolean;
    esp32?: boolean;
    relay2?: boolean;
    temp?: boolean;
    hum?: boolean;
    pir?: boolean;
    yolo?: boolean;
  };
  className?: string;
}

export const Monitor: React.FC<MonitorProps> = ({
  mode = 'CHECKS',
  checkProgress = { sensors: true, esp32: true, camera: true, yolo: true, database: true },
  crackProgress = 0,
  glitchOffset = 0,
  scanlineY = 0,
  portsLit = {},
  className,
}) => {
  const is404 = mode === '404';

  return (
    <g id="monitor-system" className={className}>
      {/* 1. Keyboard Silhouette at Bottom */}
      <g transform="translate(0, 440)">
        <polygon points="-400,0 400,0 480,90 -480,90" fill="#26262B" stroke="#111111" strokeWidth={5} />
        {/* Key Rows Hatching */}
        {[-30, 0, 30].map((ky) => (
          <line key={`key-row-${ky}`} x1={-380} y1={ky + 45} x2={380} y2={ky + 45} stroke="#111111" strokeWidth={3} />
        ))}
      </g>

      {/* 2. Heavy Chunky Monitor Stand */}
      <g transform="translate(0, 360)">
        {/* Stand Neck Column */}
        <rect x={-60} y={0} width={120} height={100} fill="#CFCABC" stroke="#111111" strokeWidth={5} />
        {/* Heavy Rectangular Base Plate */}
        <rect x={-220} y={80} width={440} height={40} rx={4} fill="#26262B" stroke="#111111" strokeWidth={5} />
      </g>

      {/* 3. Monitor Body Hard Shadow */}
      <rect x={-600 + 16} y={-360 + 16} width={1200} height={720} rx={8} fill="#111111" />

      {/* 4. Monitor Bezel Frame (1200 x 720) */}
      <g id="mon__body">
        <rect
          x={-600}
          y={-360}
          width={1200}
          height={720}
          rx={8}
          fill="#F4F0E6"
          stroke="#111111"
          strokeWidth={8}
        />

        {/* Port Notches along Bezel Edges (Fill Yellow when active) */}
        {/* Top Edge: Relay1, ESP32, Relay2, Temp, Hum */}
        <rect x={-270} y={-360} width={40} height={14} fill={portsLit.relay1 ? '#FFD83D' : '#111111'} stroke="#111111" strokeWidth={2} />
        <rect x={-20} y={-360} width={40} height={14} fill={portsLit.esp32 ? '#FFD83D' : '#111111'} stroke="#111111" strokeWidth={2} />
        <rect x={130} y={-360} width={40} height={14} fill={portsLit.relay2 ? '#FFD83D' : '#111111'} stroke="#111111" strokeWidth={2} />
        <rect x={280} y={-360} width={40} height={14} fill={portsLit.temp ? '#FFD83D' : '#111111'} stroke="#111111" strokeWidth={2} />
        <rect x={380} y={-360} width={40} height={14} fill={portsLit.hum ? '#FFD83D' : '#111111'} stroke="#111111" strokeWidth={2} />

        {/* Left Edge: PIR Trunk */}
        <rect x={-600} y={-220} width={14} height={40} fill={portsLit.pir ? '#FFD83D' : '#111111'} stroke="#111111" strokeWidth={2} />
        {/* Right Edge: YOLO Trunk */}
        <rect x={586} y={-220} width={14} height={40} fill={portsLit.yolo ? '#FFD83D' : '#111111'} stroke="#111111" strokeWidth={2} />

        {/* Bottom Bezel Details */}
        <circle cx={520} cy={320} r={6} fill={is404 ? '#E53935' : '#35C759'} stroke="#111111" strokeWidth={2} />
        <text
          x={0}
          y={328}
          fontSize={14}
          fontWeight={900}
          fontFamily="'Archivo', sans-serif"
          fill="#111111"
          textAnchor="middle"
          letterSpacing="0.12em"
        >
          SMART CLASSROOM · CENTRAL TELEMETRY HOST
        </text>
      </g>

      {/* 5. Active Screen Area (1080 x 608) */}
      <g id="mon__screen" transform="translate(0, -20)">
        <rect
          x={-540}
          y={-304}
          width={1080}
          height={608}
          fill={is404 ? '#E53935' : '#111111'}
          stroke="#111111"
          strokeWidth={4}
        />
        {/* Inner paper keyline */}
        <rect
          x={-534}
          y={-298}
          width={1068}
          height={596}
          fill="none"
          stroke="#F4F0E6"
          strokeWidth={2}
          opacity={0.3}
        />

        {/* Screen Content: Checks / Connecting Mode */}
        {!is404 && (
          <g transform="translate(-480, -200)">
            {/* Host Header */}
            <text x={0} y={0} fontSize={18} fontWeight={700} fontFamily="'IBM Plex Mono', monospace" fill="#FFD83D">
              HOST LINK ESTABLISHED · SYSTEM VERIFICATION
            </text>
            <line x1={0} y1={14} x2={960} y2={14} stroke="#333333" strokeWidth={2} />

            {/* Check Lines (Non-negotiable correction 4: SENSORS: SIM, ESP32: TARGET, CAMERA: LIVE...) */}
            <g transform="translate(0, 60)" fontSize={18} fontWeight={700} fontFamily="'IBM Plex Mono', monospace">
              {/* Sensors */}
              <text x={0} y={0} fill="#F4F0E6">
                SENSORS .........................................
              </text>
              <text x={640} y={0} fill={checkProgress.sensors ? '#35C759' : '#666'}>
                {checkProgress.sensors ? 'SIM' : 'PENDING'}
              </text>

              {/* ESP32 */}
              <text x={0} y={45} fill="#F4F0E6">
                ESP32 ...........................................
              </text>
              <text x={640} y={45} fill={checkProgress.esp32 ? '#FFD83D' : '#666'}>
                {checkProgress.esp32 ? 'TARGET' : 'PENDING'}
              </text>

              {/* Camera */}
              <text x={0} y={90} fill="#F4F0E6">
                CAMERA ..........................................
              </text>
              <text x={640} y={90} fill={checkProgress.camera ? '#35C759' : '#666'}>
                {checkProgress.camera ? 'LIVE' : 'PENDING'}
              </text>

              {/* YOLO11n */}
              <text x={0} y={135} fill="#F4F0E6">
                YOLO11n .........................................
              </text>
              <text x={640} y={135} fill={checkProgress.yolo ? '#35C759' : '#666'}>
                {checkProgress.yolo ? 'LIVE' : 'PENDING'}
              </text>

              {/* Database */}
              <text x={0} y={180} fill="#F4F0E6">
                DATABASE ........................................
              </text>
              <text x={640} y={180} fill={checkProgress.database ? '#35C759' : '#666'}>
                {checkProgress.database ? 'LIVE' : 'PENDING'}
              </text>
            </g>

            {/* Honesty Tag at Screen Bottom (§6, Non-negotiable correction 4) */}
            <g transform="translate(0, 360)">
              <rect x={0} y={-18} width={380} height={28} fill="#26262B" stroke="#FFD83D" strokeWidth={1.5} />
              <text x={16} y={1} fontSize={11} fontWeight={700} fontFamily="'IBM Plex Mono', monospace" fill="#FFD83D">
                DEMO SEQUENCE · NOT LIVE STATUS
              </text>
            </g>
          </g>
        )}

        {/* Screen Content: 404 Glitch Mode (§6 Scene 12) */}
        {is404 && (
          <g id="screen-404-content">
            {/* Theatrical 404 Title with Glitch Slices */}
            <g transform={`translate(${glitchOffset}, 0)`}>
              {/* Paper plate under 404 for WCAG AA contrast against red background */}
              <rect x={-320} y={-180} width={640} height={190} fill="#111111" stroke="#F4F0E6" strokeWidth={4} />
              <text
                x={0}
                y={-30}
                fontSize={150}
                fontWeight={900}
                fontFamily="'Archivo', sans-serif"
                fill="#F4F0E6"
                textAnchor="middle"
                letterSpacing="-0.04em"
              >
                404
              </text>
            </g>

            {/* Sub-banners */}
            <g transform="translate(0, 60)">
              <rect x={-260} y={0} width={520} height={42} fill="#111111" stroke="#F4F0E6" strokeWidth={2} />
              <text
                x={0}
                y={28}
                fontSize={20}
                fontWeight={900}
                fontFamily="'Archivo', sans-serif"
                fill="#FFD83D"
                textAnchor="middle"
                letterSpacing="0.08em"
              >
                CLASSROOM NOT FOUND
              </text>
            </g>

            <g transform="translate(0, 120)">
              <rect x={-240} y={0} width={480} height={32} fill="#111111" stroke="#F4F0E6" strokeWidth={2} />
              <text
                x={0}
                y={22}
                fontSize={12}
                fontWeight={700}
                fontFamily="'IBM Plex Mono', monospace"
                fill="#F4F0E6"
                textAnchor="middle"
                letterSpacing="0.06em"
              >
                SYSTEM RESPONSE INTERRUPTED · REBOOT REQUIRED
              </text>
            </g>

            {/* Glitch Scanline Bar */}
            <rect
              x={-534}
              y={scanlineY}
              width={1068}
              height={14}
              fill="#F4F0E6"
              opacity={0.4}
            />

            {/* Glitch Noise Blocks */}
            <rect x={-400 + glitchOffset} y={-80} width={80} height={20} fill="#111111" />
            <rect x={280 - glitchOffset} y={-120} width={120} height={30} fill="#111111" />
          </g>
        )}

        {/* 6. Crack Lines Overlay (draws across screen 87.0 -> 87.6) */}
        {crackProgress > 0.05 && (
          <g id="mon__crack" opacity={Math.min(1, crackProgress * 1.8)}>
            <path
              d="M-500 -240 L-220 -80 L-140 -120 L40 60 L180 -30 L450 220"
              fill="none"
              stroke="#F4F0E6"
              strokeWidth={3.5}
              strokeLinecap="round"
            />
            <path
              d="M-140 -120 L-60 -210 M40 60 L-30 180 M180 -30 L320 -150"
              fill="none"
              stroke="#F4F0E6"
              strokeWidth={2}
            />
          </g>
        )}
      </g>
    </g>
  );
};
