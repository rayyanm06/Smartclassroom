import React, { useRef, useState, useEffect } from 'react';
import { useTrack } from '../../engine/useTrack';
import { W, seg, lerp } from '../../engine/timeline';
import { outCubic, inOutSine } from '../../engine/easing';
import { PirSensor } from '../hardware/PirSensor';
import { Dht11Sensor } from '../hardware/Dht11Sensor';
import { TechnicalLabel } from '../../primitives/TechnicalLabel';
import { TelemetryBadge } from '../../primitives/TelemetryBadge';
import { energyProgress } from '../../energy/energyProgress';
import { T } from '../../energy/energyTimeline';
import { pulse } from '../../energy/energyMath';

interface SensorSceneProps {
  zoom?: number;
}

export const SensorScene: React.FC<SensorSceneProps> = ({ zoom = 1 }) => {
  const pirRef = useRef<SVGGElement>(null);
  const dhtRef = useRef<SVGGElement>(null);
  const [pirTicks, setPirTicks] = useState(0);
  const [dhtTicks, setDhtTicks] = useState(0);
  const [pirLabelProg, setPirLabelProg] = useState(0);
  const [dhtLabelProg, setDhtLabelProg] = useState(0);

  useEffect(() => {
    return energyProgress.subscribe((p) => {
      const pirPulse = pulse(p, T.pirCharge[0], T.pirCharge[1]);
      const dhtPulse = pulse(p, T.dhtCharge[0], T.dhtCharge[1]);
      if (pirRef.current) {
        pirRef.current.style.translate = pirPulse > 0.05 ? '0px -2px' : '0px 0px';
      }
      if (dhtRef.current) {
        dhtRef.current.style.translate = dhtPulse > 0.05 ? '0px -2px' : '0px 0px';
      }
    });
  }, []);

  useTrack((p, ctx) => {
    // Cull before 18.5 or after 90
    if (p < 18.5 || p > 90) {
      if (pirRef.current) pirRef.current.setAttribute('visibility', 'hidden');
      if (dhtRef.current) dhtRef.current.setAttribute('visibility', 'hidden');
      return;
    }

    const isPortrait = ctx.layout === 'PORTRAIT';

    // 1. PIR Animation (Scenes 03: 20 -> 27)
    if (pirRef.current) {
      if (p < 18.5) {
        pirRef.current.setAttribute('visibility', 'hidden');
      } else {
        pirRef.current.setAttribute('visibility', 'visible');
        let px = 700;
        let py = 600;
        let rot = 0;

        if (isPortrait) {
          px = 450;
          if (p < W.pirInA[0]) {
            py = -250;
            rot = -8;
          } else if (p < W.pirInA[1]) {
            const t = seg(p, W.pirInA[0], W.pirInA[1], outCubic);
            py = lerp(-250, 485, t);
            rot = lerp(-8, 2, t);
            setPirTicks(1 - t);
          } else if (p < W.pirInB[1]) {
            const t = seg(p, W.pirInB[0], W.pirInB[1], inOutSine);
            py = lerp(485, 470, t);
            rot = lerp(2, 0, t);
            setPirTicks(0);
          } else {
            py = 470;
            rot = 0;
            setPirTicks(0);
          }
        } else {
          // Landscape
          py = 600;
          if (p < W.pirInA[0]) {
            px = 0;
            rot = -8;
          } else if (p < W.pirInA[1]) {
            const t = seg(p, W.pirInA[0], W.pirInA[1], outCubic);
            px = lerp(0, 735, t);
            rot = lerp(-8, 2, t);
            setPirTicks(1 - t);
          } else if (p < W.pirInB[1]) {
            const t = seg(p, W.pirInB[0], W.pirInB[1], inOutSine);
            px = lerp(735, 700, t);
            rot = lerp(2, 0, t);
            setPirTicks(0);
          } else {
            px = 700;
            rot = 0;
            setPirTicks(0);
          }
        }

        pirRef.current.setAttribute('transform', `translate(${px}, ${py}) rotate(${rot})`);
      }
    }

    // 2. DHT11 Animation (Scene 04: 27 -> 34)
    if (dhtRef.current) {
      if (p < 25.5) {
        dhtRef.current.setAttribute('visibility', 'hidden');
      } else {
        dhtRef.current.setAttribute('visibility', 'visible');
        let dx = 1700;
        let dy = 600;
        let rot = 0;

        if (isPortrait) {
          dx = 450;
          if (p < W.dhtInA[0]) {
            dy = 1800;
            rot = 8;
          } else if (p < W.dhtInA[1]) {
            const t = seg(p, W.dhtInA[0], W.dhtInA[1], outCubic);
            dy = lerp(1800, 1315, t);
            rot = lerp(8, -2, t);
            setDhtTicks(1 - t);
          } else if (p < W.dhtInB[1]) {
            const t = seg(p, W.dhtInB[0], W.dhtInB[1], inOutSine);
            dy = lerp(1315, 1330, t);
            rot = lerp(-2, 0, t);
            setDhtTicks(0);
          } else {
            dy = 1330;
            rot = 0;
            setDhtTicks(0);
          }
        } else {
          // Landscape
          dy = 600;
          if (p < W.dhtInA[0]) {
            dx = 2300;
            rot = 8;
          } else if (p < W.dhtInA[1]) {
            const t = seg(p, W.dhtInA[0], W.dhtInA[1], outCubic);
            dx = lerp(2300, 1665, t);
            rot = lerp(8, -2, t);
            setDhtTicks(1 - t);
          } else if (p < W.dhtInB[1]) {
            const t = seg(p, W.dhtInB[0], W.dhtInB[1], inOutSine);
            dx = lerp(1665, 1700, t);
            rot = lerp(-2, 0, t);
            setDhtTicks(0);
          } else {
            dx = 1700;
            rot = 0;
            setDhtTicks(0);
          }
        }

        dhtRef.current.setAttribute('transform', `translate(${dx}, ${dy}) rotate(${rot})`);
      }
    }

    // Label Progress (fade out when relays enter > 45)
    const fadeOut = 1 - seg(p, 44, 46);
    setPirLabelProg(seg(p, W.pirLabels[0], W.pirLabels[1]) * fadeOut);
    setDhtLabelProg(seg(p, W.dhtLabels[0], W.dhtLabels[1]) * fadeOut);
  });

  return (
    <g id="scene-03-04-sensors">
      {/* PIR Sensor */}
      <g ref={pirRef}>
        <PirSensor velocityTicks={pirTicks} />
        <TelemetryBadge x={-60} y={145} variant="SIMULATED_SENSOR" zoom={zoom} />
      </g>

      {/* DHT11 Sensor */}
      <g ref={dhtRef}>
        <Dht11Sensor velocityTicks={dhtTicks} />
        <TelemetryBadge x={-60} y={115} variant="SIMULATED_SENSOR" zoom={zoom} />
      </g>

      {/* PIR Technical Labels */}
      {pirLabelProg > 0.05 && (
        <TechnicalLabel
          targetX={700}
          targetY={540}
          labelX={520}
          labelY={460}
          text="PIR · HC-SR501"
          subtext="PASSIVE INFRARED OCCUPANCY"
          drawProgress={pirLabelProg}
          zoom={zoom}
          accent="#FFD83D"
        />
      )}

      {/* DHT11 Technical Labels */}
      {dhtLabelProg > 0.05 && (
        <TechnicalLabel
          targetX={1700}
          targetY={540}
          labelX={1840}
          labelY={460}
          text="DHT11 SENSOR"
          subtext="TEMP & HUMIDITY PROBE"
          drawProgress={dhtLabelProg}
          zoom={zoom}
          accent="#27C7E8"
        />
      )}
    </g>
  );
};
