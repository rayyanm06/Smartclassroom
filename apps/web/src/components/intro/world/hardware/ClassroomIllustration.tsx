import React from 'react';

interface ClassroomIllustrationProps {
  opacity?: number;
  annotationsProgress?: number; // 0 to 1
  zoom?: number;
}

export const ClassroomIllustration: React.FC<ClassroomIllustrationProps> = ({
  opacity = 1,
  annotationsProgress = 0,
  zoom = 1,
}) => {
  const invZ = 1 / (zoom || 1);

  return (
    <g id="classroom-illustration" transform="translate(1200, 600)" opacity={opacity}>
      {/* 1. Back Wall and Floor Line */}
      <rect x={-750} y={-410} width={1500} height={820} fill="#F4F0E6" stroke="none" />
      <line x1={-750} y1={330} x2={750} y2={330} stroke="#111111" strokeWidth={5} />

      {/* Floor Hatching Lines */}
      {[-600, -400, -200, 0, 200, 400, 600].map((x) => (
        <line
          key={`floor-${x}`}
          x1={x}
          y1={330}
          x2={x * 1.2}
          y2={410}
          stroke="#111111"
          strokeWidth={2}
          opacity={0.3}
        />
      ))}

      {/* 2. Door at Left */}
      <g id="room-door" transform="translate(-620, 110)">
        <rect x={0} y={-220} width={120} height={440} fill="#FBF8F0" stroke="#111111" strokeWidth={4} />
        {/* Door Inset Panels */}
        <rect x={15} y={-200} width={90} height={180} fill="#F4F0E6" stroke="#111111" strokeWidth={2} />
        <rect x={15} y={0} width={90} height={200} fill="#F4F0E6" stroke="#111111" strokeWidth={2} />
        {/* Door Knob */}
        <circle cx={25} cy={0} r={6} fill="#111111" />
        {/* Room Plate */}
        <rect x={20} y={-180} width={80} height={32} fill="#FFD83D" stroke="#111111" strokeWidth={2} />
        <text
          x={60}
          y={-160}
          fontSize={11}
          fontWeight={700}
          fontFamily="'IBM Plex Mono', monospace"
          fill="#111111"
          textAnchor="middle"
        >
          ROOM 508
        </text>
      </g>

      {/* 3. Blackboard in Center */}
      <g id="blackboard" transform="translate(0, -180)">
        {/* Shadow */}
        <rect x={-310 + 8} y={-100 + 8} width={620} height={200} fill="#111111" />
        {/* Board Frame */}
        <rect x={-310} y={-100} width={620} height={200} fill="#26262B" stroke="#111111" strokeWidth={6} />
        {/* Inner Surface */}
        <rect x={-295} y={-85} width={590} height={170} fill="#1E2322" stroke="#F4F0E6" strokeWidth={1} strokeOpacity={0.2} />
        {/* Chalk Tray */}
        <rect x={-320} y={100} width={640} height={14} fill="#CFCABC" stroke="#111111" strokeWidth={3} />
        {/* Chalk Pieces */}
        <rect x={-120} y={96} width={24} height={6} fill="#F4F0E6" />
        <rect x={-80} y={96} width={18} height={6} fill="#FFD83D" />
        {/* Mathematical Silhouettes on Blackboard */}
        <path d="M-220 -40 Q-190 -70 -160 -40 T-100 -40" fill="none" stroke="#F4F0E6" strokeWidth={2} opacity={0.3} />
        <text x={80} y={-20} fill="#F4F0E6" fontSize={18} opacity={0.25} fontFamily="'IBM Plex Mono', monospace">
          ∫ f(x)dx · 508
        </text>
      </g>

      {/* 4. Ceiling Light Batten */}
      <g id="ceiling-light" transform="translate(0, -360)">
        <rect x={-210} y={-16} width={420} height={32} fill="#FBF8F0" stroke="#111111" strokeWidth={4} />
        <rect x={-190} y={-6} width={380} height={12} fill="#E6E0D0" stroke="#111111" strokeWidth={1.5} />
        {/* Mounting Rods */}
        <line x1={-150} y1={-16} x2={-150} y2={-50} stroke="#111111" strokeWidth={3} />
        <line x1={150} y1={-16} x2={150} y2={-50} stroke="#111111" strokeWidth={3} />
      </g>

      {/* 5. Wall Clock at Right */}
      <g id="wall-clock" transform="translate(480, -220)">
        <circle cx={0} cy={0} r={46} fill="#FBF8F0" stroke="#111111" strokeWidth={4} />
        <circle cx={0} cy={0} r={4} fill="#111111" />
        <line x1={0} y1={0} x2={0} y2={-24} stroke="#111111" strokeWidth={3} strokeLinecap="round" />
        <line x1={0} y1={0} x2={16} y2={0} stroke="#111111" strokeWidth={2.5} strokeLinecap="round" />
        {/* Hour markers */}
        {[0, 90, 180, 270].map((deg) => (
          <line
            key={`clock-tick-${deg}`}
            x1={0}
            y1={-38}
            x2={0}
            y2={-42}
            stroke="#111111"
            strokeWidth={2}
            transform={`rotate(${deg})`}
          />
        ))}
      </g>

      {/* 6. Three Rows of Desks & Chairs */}
      {/* Row 3 (Back row, scale 0.8) */}
      <g transform="translate(0, 160) scale(0.8)">
        {[-380, -190, 0, 190, 380].map((x, i) => (
          <g key={`desk-r3-${i}`} transform={`translate(${x}, 0)`}>
            {/* Chair Back */}
            <rect x={-30} y={-45} width={60} height={35} fill="#CFCABC" stroke="#111111" strokeWidth={2} />
            <line x1={-20} y1={-10} x2={-20} y2={30} stroke="#111111" strokeWidth={2.5} />
            <line x1={20} y1={-10} x2={20} y2={30} stroke="#111111" strokeWidth={2.5} />
            {/* Desk Top */}
            <rect x={-75} y={-10} width={150} height={36} fill="#E6E0D0" stroke="#111111" strokeWidth={3} />
            <line x1={-60} y1={26} x2={-60} y2={70} stroke="#111111" strokeWidth={3} />
            <line x1={60} y1={26} x2={60} y2={70} stroke="#111111" strokeWidth={3} />
          </g>
        ))}
      </g>

      {/* Row 2 (Middle row, scale 0.9) */}
      <g transform="translate(0, 220) scale(0.9)">
        {[-380, -190, 0, 190, 380].map((x, i) => (
          <g key={`desk-r2-${i}`} transform={`translate(${x}, 0)`}>
            <rect x={-32} y={-48} width={64} height={38} fill="#CFCABC" stroke="#111111" strokeWidth={2.5} />
            <line x1={-22} y1={-10} x2={-22} y2={32} stroke="#111111" strokeWidth={3} />
            <line x1={22} y1={-10} x2={22} y2={32} stroke="#111111" strokeWidth={3} />
            <rect x={-80} y={-10} width={160} height={40} fill="#E6E0D0" stroke="#111111" strokeWidth={3.5} />
            <line x1={-65} y1={30} x2={-65} y2={80} stroke="#111111" strokeWidth={3.5} />
            <line x1={65} y1={30} x2={65} y2={80} stroke="#111111" strokeWidth={3.5} />
          </g>
        ))}
      </g>

      {/* Row 1 (Front row, scale 1.0) */}
      <g transform="translate(0, 290)">
        {[-380, -190, 0, 190, 380].map((x, i) => (
          <g key={`desk-r1-${i}`} transform={`translate(${x}, 0)`}>
            <rect x={-36} y={-52} width={72} height={42} fill="#CFCABC" stroke="#111111" strokeWidth={3} />
            <line x1={-24} y1={-10} x2={-24} y2={35} stroke="#111111" strokeWidth={3.5} />
            <line x1={24} y1={-10} x2={24} y2={35} stroke="#111111" strokeWidth={3.5} />
            <rect x={-88} y={-10} width={176} height={46} fill="#E6E0D0" stroke="#111111" strokeWidth={4} />
            <line x1={-72} y1={36} x2={-72} y2={95} stroke="#111111" strokeWidth={4} />
            <line x1={72} y1={36} x2={72} y2={95} stroke="#111111" strokeWidth={4} />
          </g>
        ))}
      </g>

      {/* 7. Scene 01 Technical Leader Annotations (Controlled via IntroScene track) */}
      <g id="room-annotations" opacity={annotationsProgress}>
          {/* Ceiling Light Callout */}
          <line x1={180} y1={-360} x2={260} y2={-360} stroke="#111111" strokeWidth={2 * invZ} strokeDasharray="4 3" />
          <g transform={`translate(270, -360) scale(${invZ})`}>
            <rect x={0} y={-12} width={110} height={24} fill="#F4F0E6" stroke="#111111" strokeWidth={2} />
            <text x={8} y={4} fontSize={11} fontWeight={700} fontFamily="'IBM Plex Mono', monospace" fill="#111111">
              CEILING LIGHT
            </text>
          </g>

          {/* Blackboard Callout */}
          <line x1={310} y1={-160} x2={380} y2={-160} stroke="#111111" strokeWidth={2 * invZ} strokeDasharray="4 3" />
          <g transform={`translate(390, -160) scale(${invZ})`}>
            <rect x={0} y={-12} width={60} height={24} fill="#F4F0E6" stroke="#111111" strokeWidth={2} />
            <text x={8} y={4} fontSize={11} fontWeight={700} fontFamily="'IBM Plex Mono', monospace" fill="#111111">
              BOARD
            </text>
          </g>

          {/* Door Callout */}
          <line x1={-500} y1={100} x2={-430} y2={100} stroke="#111111" strokeWidth={2 * invZ} strokeDasharray="4 3" />
          <g transform={`translate(-420, 100) scale(${invZ})`}>
            <rect x={0} y={-12} width={50} height={24} fill="#F4F0E6" stroke="#111111" strokeWidth={2} />
            <text x={8} y={4} fontSize={11} fontWeight={700} fontFamily="'IBM Plex Mono', monospace" fill="#111111">
              DOOR
            </text>
          </g>

          {/* Desk Row Callout */}
          <line x1={-470} y1={300} x2={-550} y2={300} stroke="#111111" strokeWidth={2 * invZ} strokeDasharray="4 3" />
          <g transform={`translate(-640, 300) scale(${invZ})`}>
            <rect x={0} y={-12} width={80} height={24} fill="#F4F0E6" stroke="#111111" strokeWidth={2} />
            <text x={8} y={4} fontSize={11} fontWeight={700} fontFamily="'IBM Plex Mono', monospace" fill="#111111">
              DESK ROW
            </text>
          </g>
        </g>
    </g>
  );
};
