import React, { useRef, useState } from 'react';
import { useTrack } from '../../engine/useTrack';
import { W, seg, lerp } from '../../engine/timeline';
import { outCubic, inOutCubic } from '../../engine/easing';
import { LANDSCAPE_PATHS } from '../../engine/paths';
import { RelayModule } from '../hardware/RelayModule';
import { CeilingLight } from '../hardware/CeilingLight';
import { SplitAc } from '../hardware/SplitAc';
import { WirePath } from '../../primitives/WirePath';
import { TechnicalLabel } from '../../primitives/TechnicalLabel';
import { TelemetryBadge } from '../../primitives/TelemetryBadge';

interface RelaySceneProps {
  zoom?: number;
}

export const RelayScene: React.FC<RelaySceneProps> = ({ zoom = 1 }) => {
  const groupRef = useRef<SVGGElement>(null);
  const relay1Ref = useRef<SVGGElement>(null);
  const relay2Ref = useRef<SVGGElement>(null);
  const lightRef = useRef<SVGGElement>(null);
  const acRef = useRef<SVGGElement>(null);

  const [state, setState] = useState({
    wireR1Sig: 0,
    wireR2Sig: 0,
    wireLoad1: 0,
    wireLoad2: 0,
    lever1Angle: 22,
    lever2Angle: 22,
    lightOn: false,
    lightIntensity: 0,
    acOn: false,
    acFlap: 0,
    labelsProg: 0,
  });

  useTrack((p) => {
    // Visible from 44.5 to 90
    if (p < 44.5 || p > 90) {
      if (groupRef.current) groupRef.current.setAttribute('visibility', 'hidden');
      return;
    }
    if (groupRef.current) groupRef.current.setAttribute('visibility', 'visible');

    // 1. Relay 01 fly-in (45 -> 47.5)
    if (relay1Ref.current) {
      let r1x = 700;
      let r1y = 1060;
      let r1Rot = 0;
      if (p < W.relay1In[0]) {
        r1x = 200;
        r1y = 1460;
        r1Rot = -10;
      } else if (p < W.relay1In[1]) {
        const t = seg(p, W.relay1In[0], W.relay1In[1], outCubic);
        r1x = lerp(200, 700, t);
        r1y = lerp(1460, 1060, t);
        r1Rot = lerp(-10, 0, t);
      }
      relay1Ref.current.setAttribute('transform', `translate(${r1x}, ${r1y}) rotate(${r1Rot})`);
    }

    // 2. Relay 02 fly-in (46 -> 48.5)
    if (relay2Ref.current) {
      let r2x = 1700;
      let r2y = 1060;
      let r2Rot = 0;
      if (p < W.relay2In[0]) {
        r2x = 2200;
        r2y = 1460;
        r2Rot = 10;
      } else if (p < W.relay2In[1]) {
        const t = seg(p, W.relay2In[0], W.relay2In[1], outCubic);
        r2x = lerp(2200, 1700, t);
        r2y = lerp(1460, 1060, t);
        r2Rot = lerp(10, 0, t);
      }
      relay2Ref.current.setAttribute('transform', `translate(${r2x}, ${r2y}) rotate(${r2Rot})`);
    }

    // 3. Light rises into place (49.5 -> 52)
    if (lightRef.current) {
      let ly = 1360;
      if (p < W.lightIn[0]) {
        ly = 1560;
      } else if (p < W.lightIn[1]) {
        const t = seg(p, W.lightIn[0], W.lightIn[1], outCubic);
        ly = lerp(1560, 1360, t);
      }
      lightRef.current.setAttribute('transform', `translate(400, ${ly})`);
    }

    // 4. AC rises into place (50.5 -> 53)
    if (acRef.current) {
      let ay = 1380;
      if (p < W.acIn[0]) {
        ay = 1580;
      } else if (p < W.acIn[1]) {
        const t = seg(p, W.acIn[0], W.acIn[1], outCubic);
        ay = lerp(1580, 1380, t);
      }
      acRef.current.setAttribute('transform', `translate(2000, ${ay})`);
    }

    // 5. Signal wires draw
    const r1Sig = seg(p, W.relay1Sig[0], W.relay1Sig[1]);
    const r2Sig = seg(p, W.relay2Sig[0], W.relay2Sig[1]);

    // 6. Load wires draw
    const l1Wire = seg(p, W.load1Wire[0], W.load1Wire[1]);
    const l2Wire = seg(p, W.load2Wire[0], W.load2Wire[1]);

    // 7. Lever flips:
    // Relay 1 flips to ON at 53 -> 53.5, flips to OFF at 58.3 -> 58.8, flips back ON at 69.4 -> 69.9
    let l1Angle = 22; // OFF
    if (p >= W.lever1On[0] && p < W.lever1Off[0]) {
      const t = seg(p, W.lever1On[0], W.lever1On[1], inOutCubic);
      l1Angle = lerp(22, -22, t);
    } else if (p >= W.lever1Off[0] && p < W.lever1BackOn[0]) {
      const t = seg(p, W.lever1Off[0], W.lever1Off[1], inOutCubic);
      l1Angle = lerp(-22, 22, t);
    } else if (p >= W.lever1BackOn[0]) {
      const t = seg(p, W.lever1BackOn[0], W.lever1BackOn[1], inOutCubic);
      l1Angle = lerp(22, -22, t);
    }

    // Relay 2 flips to ON at 53.9 -> 54.3, flips to OFF at 58.6 -> 59.1
    let l2Angle = 22;
    if (p >= W.lever2On[0] && p < W.lever2Off[0]) {
      const t = seg(p, W.lever2On[0], W.lever2On[1], inOutCubic);
      l2Angle = lerp(22, -22, t);
    } else if (p >= W.lever2Off[0]) {
      const t = seg(p, W.lever2Off[0], W.lever2Off[1], inOutCubic);
      l2Angle = lerp(-22, 22, t);
    }

    // 8. Light & AC ON/OFF state
    // Light is ON 53.5 -> 58.6, then OFF 58.6 -> 69.9, then back ON 69.9 -> 70.8
    let lIntensity = 0;
    let isLOn = false;
    if (p >= W.lightOn[0] && p < W.lightOff[0]) {
      lIntensity = seg(p, W.lightOn[0], W.lightOn[1]);
      isLOn = lIntensity > 0.1;
    } else if (p >= W.lightOff[0] && p < W.lightBackOn[0]) {
      lIntensity = 1 - seg(p, W.lightOff[0], W.lightOff[1]);
      isLOn = lIntensity > 0.1;
    } else if (p >= W.lightBackOn[0]) {
      lIntensity = seg(p, W.lightBackOn[0], W.lightBackOn[1]);
      isLOn = lIntensity > 0.1;
    }

    // AC is ON 54.3 -> 59.0, then OFF
    let acFlapAngle = 0;
    let isAcOn = false;
    if (p >= W.acOn[0] && p < W.acOff[0]) {
      const t = seg(p, W.acOn[0], W.acOn[1]);
      acFlapAngle = lerp(0, -35, t);
      isAcOn = t > 0.1;
    } else if (p >= W.acOff[0]) {
      const t = 1 - seg(p, W.acOff[0], W.acOff[1]);
      acFlapAngle = lerp(0, -35, t);
      isAcOn = t > 0.1;
    }

    // Labels progress
    const lProg = seg(p, W.relayLabels[0], W.relayLabels[1]) * (1 - seg(p, 59, 61));

    setState({
      wireR1Sig: r1Sig,
      wireR2Sig: r2Sig,
      wireLoad1: l1Wire,
      wireLoad2: l2Wire,
      lever1Angle: l1Angle,
      lever2Angle: l2Angle,
      lightOn: isLOn,
      lightIntensity: lIntensity,
      acOn: isAcOn,
      acFlap: acFlapAngle,
      labelsProg: lProg,
    });
  });

  return (
    <g ref={groupRef} id="scene-07-relays">
      {/* ESP32 -> Relay Signal Wires */}
      <WirePath
        d={LANDSCAPE_PATHS.relay1Sig}
        progress={state.wireR1Sig}
        outerWidth={14}
        coreWidth={6}
        coreColor="#FFD83D"
        plugEnd
      />
      <WirePath
        d={LANDSCAPE_PATHS.relay2Sig}
        progress={state.wireR2Sig}
        outerWidth={14}
        coreWidth={6}
        coreColor="#FFD83D"
        plugEnd
      />

      {/* Relay -> Load Wires */}
      <WirePath
        d={LANDSCAPE_PATHS.relay1Out}
        progress={state.wireLoad1}
        outerWidth={16}
        coreWidth={6}
        coreColor="#FFD83D"
      />
      <WirePath
        d={LANDSCAPE_PATHS.relay2Out}
        progress={state.wireLoad2}
        outerWidth={16}
        coreWidth={6}
        coreColor="#FFD83D"
      />

      {/* Relay 01 */}
      <g ref={relay1Ref}>
        <RelayModule
          label="RELAY 01 · LIGHT"
          isEnergized={state.lightOn}
          leverAngle={state.lever1Angle}
        />
        <TelemetryBadge x={-60} y={110} variant="TARGET_HARDWARE" zoom={zoom} />
      </g>

      {/* Relay 02 */}
      <g ref={relay2Ref}>
        <RelayModule
          label="RELAY 02 · HVAC"
          isEnergized={state.acOn}
          leverAngle={state.lever2Angle}
          isMirrored
        />
        <TelemetryBadge x={-60} y={110} variant="TARGET_HARDWARE" zoom={zoom} />
      </g>

      {/* Classroom Light Load Fixture */}
      <g ref={lightRef}>
        <CeilingLight isOn={state.lightOn} intensity={state.lightIntensity} />
      </g>

      {/* Split AC Load Indoor Unit */}
      <g ref={acRef}>
        <SplitAc isOn={state.acOn} flapAngle={state.acFlap} streakProgress={state.acOn ? 1 : 0} />
      </g>

      {/* Technical Labels */}
      {state.labelsProg > 0.05 && (
        <>
          <TechnicalLabel
            targetX={700}
            targetY={1000}
            labelX={520}
            labelY={920}
            text="RELAY 01 · LIGHTS"
            subtext="SOLID-STATE SWITCHING"
            drawProgress={state.labelsProg}
            zoom={zoom}
            accent="#356AE6"
          />
          <TechnicalLabel
            targetX={1700}
            targetY={1000}
            labelX={1840}
            labelY={920}
            text="RELAY 02 · AC"
            subtext="COMPRESSOR CONTACTOR"
            drawProgress={state.labelsProg}
            zoom={zoom}
            accent="#356AE6"
          />
        </>
      )}
    </g>
  );
};
