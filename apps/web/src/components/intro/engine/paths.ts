export function orthoPath(points: readonly (readonly [number, number])[], r = 30): string {
  if (points.length < 2) return '';
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const dx1 = curr[0] - prev[0];
    const dy1 = curr[1] - prev[1];
    const dx2 = next[0] - curr[0];
    const dy2 = next[1] - curr[1];

    const len1 = Math.hypot(dx1, dy1);
    const len2 = Math.hypot(dx2, dy2);
    const actualR = Math.min(r, len1 / 2, len2 / 2);

    const startX = curr[0] - (dx1 / (len1 || 1)) * actualR;
    const startY = curr[1] - (dy1 / (len1 || 1)) * actualR;
    const endX = curr[0] + (dx2 / (len2 || 1)) * actualR;
    const endY = curr[1] + (dy2 / (len2 || 1)) * actualR;

    d += ` L${startX} ${startY} Q${curr[0]} ${curr[1]} ${endX} ${endY}`;
  }
  const last = points[points.length - 1];
  d += ` L${last[0]} ${last[1]}`;
  return d;
}

export const LANDSCAPE_PATHS = {
  // Sensor wires
  pirSig: 'M818 640 H900 C960 640 980 560 1040 560 H1092',
  pirVcc: 'M818 610 H880 C930 610 960 450 1030 450 H1092',
  pirGnd: 'M818 670 H880 C930 670 960 720 1030 720 H1092',

  dhtSig: 'M1602 600 H1500 C1440 600 1420 560 1360 560 H1308',
  dhtVcc: 'M1602 570 H1520 C1470 570 1440 450 1370 450 H1308',
  dhtGnd: 'M1602 630 H1520 C1470 630 1440 720 1370 720 H1308',

  // Relay signal wires
  relay1Sig: 'M1092 780 H1040 Q1000 780 1000 820 V860 Q1000 900 960 900 H740 Q700 900 700 940 V965',
  relay2Sig: 'M1308 780 H1360 Q1400 780 1400 820 V860 Q1400 900 1440 900 H1660 Q1700 900 1700 940 V965',

  // Load wires
  relay1Out: 'M600 1130 V1190 Q600 1220 570 1220 H430 Q400 1220 400 1250 V1295',
  relay2Out: 'M1800 1130 V1190 Q1800 1220 1830 1220 H1970 Q2000 1220 2000 1250 V1290',

  // RTSP camera wire
  rtsp: 'M2515 700 H2640',

  // 7 Trunk data explosion lines (Scene 10)
  trunkEsp32: 'M1200 832 V1560',
  trunkPir: 'M700 735 V780 Q700 810 670 810 H100 Q70 810 70 840 V1670 Q70 1700 100 1700 H600',
  trunkRelay1: 'M760 1158 V1440 Q760 1470 790 1470 H920 Q950 1470 950 1500 V1560',
  trunkRelay2: 'M1640 1158 V1420 Q1640 1450 1610 1450 H1380 Q1350 1450 1350 1480 V1560',
  trunkDhtTemp: 'M1740 702 V740 Q1740 770 1770 770 H2250 Q2280 770 2280 800 V1470 Q2280 1500 2250 1500 H1530 Q1500 1500 1500 1530 V1560',
  trunkDhtHum: 'M1780 702 V800 Q1780 830 1810 830 H2280 Q2310 830 2310 860 V1500 Q2310 1530 2280 1530 H1630 Q1600 1530 1600 1560',
  trunkYolo: 'M3140 990 V1670 Q3140 1700 3110 1700 H1800',
} as const;

export const PORTRAIT_PATHS = {
  // Sensor wires
  pirSig: 'M490 600 V792',
  pirVcc: 'M530 600 C530 700 600 700 600 792',
  pirGnd: 'M450 600 C450 700 330 700 330 792',

  dhtSig: 'M490 1240 V1008',
  dhtVcc: 'M560 1240 C560 1120 600 1130 600 1008',
  dhtGnd: 'M420 1240 C420 1120 330 1130 330 1008',

  // Relay signal wires
  relay1Sig: 'M240 1008 V1819',
  relay2Sig: 'M280 1008 V1140 Q280 1170 310 1170 H660 Q690 1170 690 1200 V1819',

  // Load wires
  relay1Out: 'M240 1985 V2330',
  relay2Out: 'M660 1985 V2325',

  // RTSP camera wire
  rtsp: 'M196 2990 H382',

  // 5 Portrait trunk lines
  trunkEsp32: orthoPath([[670, 900], [880, 900], [880, 3720], [720, 3720], [720, 3748]]),
  trunkDht: orthoPath([[540, 1330], [860, 1330], [860, 3690], [630, 3690], [630, 3748]]),
  trunkRelay2: orthoPath([[770, 1930], [840, 1930], [840, 3660], [540, 3660], [540, 3748]]),
  trunkYolo: orthoPath([[715, 3275], [715, 3300], [820, 3300], [820, 3630], [450, 3630], [450, 3748]]),
  trunkRelay1: orthoPath([[130, 1930], [30, 1930], [30, 3690], [270, 3690], [270, 3748]]),
} as const;
