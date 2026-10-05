import React from 'react';
import { LightningBolt } from './LightningBolt';
import { T } from './energyTimeline';
import { LANDSCAPE_PATHS } from '../engine/paths';
import type { Palette } from './energyTypes';

interface TrunkDef {
  source: string;
  guideD: string;
  palette: Palette;
  seed: number;
  ampRatio: number;
  samples: number;
  branchCount: number;
  headCount: number;
  headCycles: number;
}

const TRUNKS: TrunkDef[] = [
  {
    source: 'ESP32',
    guideD: LANDSCAPE_PATHS.trunkEsp32,
    palette: 'fire',
    seed: 601,
    ampRatio: 0.07,
    samples: 18,
    branchCount: 9,
    headCount: 3,
    headCycles: 3,
  },
  {
    source: 'PIR',
    guideD: LANDSCAPE_PATHS.trunkPir,
    palette: 'fire',
    seed: 602,
    ampRatio: 0.07,
    samples: 18,
    branchCount: 8,
    headCount: 2,
    headCycles: 3,
  },
  {
    source: 'DHT11',
    guideD: LANDSCAPE_PATHS.trunkDhtTemp,
    palette: 'cyan',
    seed: 603,
    ampRatio: 0.06,
    samples: 18,
    branchCount: 8,
    headCount: 2,
    headCycles: 3,
  },
  {
    source: 'RELAY1',
    guideD: LANDSCAPE_PATHS.trunkRelay1,
    palette: 'fire',
    seed: 604,
    ampRatio: 0.07,
    samples: 18,
    branchCount: 8,
    headCount: 2,
    headCycles: 3,
  },
  {
    source: 'RELAY2',
    guideD: LANDSCAPE_PATHS.trunkRelay2,
    palette: 'fire',
    seed: 605,
    ampRatio: 0.07,
    samples: 18,
    branchCount: 8,
    headCount: 2,
    headCycles: 3,
  },
  {
    source: 'CAMERA',
    guideD: 'M2515 750 V1600 Q2515 1680 2480 1680 H1700',
    palette: 'cyan',
    seed: 606,
    ampRatio: 0.06,
    samples: 18,
    branchCount: 8,
    headCount: 3,
    headCycles: 3,
  },
  {
    source: 'YOLO11n',
    guideD: LANDSCAPE_PATHS.trunkYolo,
    palette: 'cyan',
    seed: 607,
    ampRatio: 0.06,
    samples: 18,
    branchCount: 8,
    headCount: 2,
    headCycles: 3,
  },
  {
    source: 'BACKEND',
    guideD: LANDSCAPE_PATHS.trunkDhtHum,
    palette: 'cyan',
    seed: 608,
    ampRatio: 0.06,
    samples: 18,
    branchCount: 8,
    headCount: 2,
    headCycles: 3,
  },
];

const AMBIENT_ARCS = [
  { d: 'M1092 600 L818 640', pal: 'fire' as Palette, seed: 611 },
  { d: 'M1308 600 L1602 600', pal: 'cyan' as Palette, seed: 612 },
  { d: 'M1092 780 L760 1000', pal: 'fire' as Palette, seed: 613 },
  { d: 'M1308 780 L1640 1000', pal: 'fire' as Palette, seed: 614 },
  { d: 'M2515 700 L2850 700', pal: 'cyan' as Palette, seed: 615 },
  { d: 'M3140 800 L3300 800', pal: 'cyan' as Palette, seed: 616 },
];

export const EnergyStorm: React.FC = () => {
  return (
    <g id="energy-storm-layer">
      {/* 8 Main Storm Trunks */}
      {TRUNKS.map((t, idx) => (
        <LightningBolt
          key={t.source}
          seed={t.seed}
          guideD={t.guideD}
          palette={t.palette}
          win={T.stormTrunk(idx)}
          ampRatio={t.ampRatio}
          samples={t.samples}
          branchCount={t.branchCount}
          headCount={t.headCount}
          headCycles={t.headCycles}
        />
      ))}

      {/* 6 Ambient Arcs between neighboring hardware */}
      {AMBIENT_ARCS.map((arc, k) => {
        const growStart = 0.74 + k * 0.008;
        const growEnd = 0.76 + k * 0.008;
        return (
          <LightningBolt
            key={`arc-${k}`}
            seed={arc.seed}
            guideD={arc.d}
            palette={arc.pal}
            win={{
              grow: [growStart, growEnd],
              head: [growStart, growEnd],
              off: [0.812, 0.822],
              idle: 0.7,
            }}
            ampRatio={0.12}
            samples={5}
            branchCount={1}
            headCount={1}
            headCycles={1}
          />
        );
      })}
    </g>
  );
};
