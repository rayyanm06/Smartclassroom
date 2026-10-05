import React, { useRef, useState } from 'react';
import { useTrack } from '../../engine/useTrack';
import { W, seg, lerp } from '../../engine/timeline';
import { outCubic, inOutSine } from '../../engine/easing';
import { Esp32Board } from '../hardware/Esp32Board';
import { TechnicalLabel } from '../../primitives/TechnicalLabel';
import { TelemetryBadge } from '../../primitives/TelemetryBadge';

interface Esp32SceneProps {
  zoom?: number;
}

export const Esp32Scene: React.FC<Esp32SceneProps> = ({ zoom = 1 }) => {
  const groupRef = useRef<SVGGElement>(null);
  const [activation, setActivation] = useState(0);
  const [txBlink, setTxBlink] = useState(false);
  const [callouts, setCallouts] = useState({
    mcu: 0,
    wifi: 0,
    gpio: 0,
    edge: 0,
  });

  useTrack((p, ctx) => {
    // Cull outside 5.5 to 90
    if (p < 5.5 || p > 90) {
      if (groupRef.current) groupRef.current.setAttribute('visibility', 'hidden');
      return;
    }
    if (groupRef.current) groupRef.current.setAttribute('visibility', 'visible');

    const isPortrait = ctx.layout === 'PORTRAIT';
    let x = isPortrait ? 450 : 1200;
    let y = 600;
    let rot = 0;
    let scale = 1;

    if (p < W.esp32Rise[0]) {
      // Below viewport before 7
      y = isPortrait ? 1800 : 1500;
      rot = 14;
      scale = 0.92;
    } else if (p < W.esp32Rise[1]) {
      // Rise phase 7 -> 13.5
      const t = seg(p, W.esp32Rise[0], W.esp32Rise[1], outCubic);
      const startY = isPortrait ? 1800 : 1500;
      const targetY = isPortrait ? 885 : 585;
      y = lerp(startY, targetY, t);
      rot = lerp(14, -4, t);
      scale = lerp(0.92, 1.0, t);
    } else if (p < W.esp32Settle[1]) {
      // Settle phase 13.5 -> 15.5
      const t = seg(p, W.esp32Settle[0], W.esp32Settle[1], inOutSine);
      const startY = isPortrait ? 885 : 585;
      const finalY = isPortrait ? 900 : 600;
      y = lerp(startY, finalY, t);
      rot = lerp(-4, 0, t);
      scale = 1.0;
    } else {
      y = isPortrait ? 900 : 600;
      rot = 0;
      scale = 1.0;
    }

    // Portrait layout rotates board 90 degrees
    const totalRot = isPortrait ? rot + 90 : rot;

    if (groupRef.current) {
      groupRef.current.setAttribute(
        'transform',
        `translate(${x}, ${y}) rotate(${totalRot}) scale(${scale})`
      );
    }

    // Activation plate & power LED
    const actProg = seg(p, W.esp32Activation[0], W.esp32Activation[1], outCubic);
    setActivation(actProg);

    // TX LED blinks during packet transfers (Scene 06 & Scene 08)
    const isTxActive = (p >= 41 && p <= 45.5) || (p >= 57.4 && p <= 58.6);
    setTxBlink(isTxActive ? Math.floor(p * 15) % 2 === 0 : false);

    // Callout lines (in 15.4 - 18.3, out 19.5 - 20.5)
    const calloutOut = 1 - seg(p, 19.5, 20.5);
    setCallouts({
      mcu: seg(p, W.calloutMcu[0], W.calloutMcu[1]) * calloutOut,
      wifi: seg(p, W.calloutWifi[0], W.calloutWifi[1]) * calloutOut,
      gpio: seg(p, W.calloutGpio[0], W.calloutGpio[1]) * calloutOut,
      edge: seg(p, W.calloutEdge[0], W.calloutEdge[1]) * calloutOut,
    });
  });

  return (
    <g id="scene-02-esp32">
      <g ref={groupRef}>
        <Esp32Board
          activationProgress={activation}
          txLedBlink={txBlink}
          powerLedOn={activation > 0.5}
        />

        {/* Hardware Honesty Chip */}
        <TelemetryBadge
          x={-50}
          y={230}
          variant="TARGET_HARDWARE"
          zoom={zoom}
          opacity={activation > 0.1 ? 1 : 0}
        />
      </g>

      {/* Static Technical Callout Overlays in World Coordinates */}
      {callouts.mcu > 0.05 && (
        <TechnicalLabel
          targetX={1200}
          targetY={530}
          labelX={1420}
          labelY={460}
          text="MCU · ESP-WROOM-32"
          subtext="DUAL-CORE 240MHz"
          drawProgress={callouts.mcu}
          zoom={zoom}
          accent="#FFD83D"
        />
      )}

      {callouts.wifi > 0.05 && (
        <TechnicalLabel
          targetX={1200}
          targetY={420}
          labelX={1420}
          labelY={380}
          text="Wi-Fi 802.11 b/g/n"
          subtext="2.4GHz ONBOARD ANTENNA"
          drawProgress={callouts.wifi}
          zoom={zoom}
          accent="#27C7E8"
        />
      )}

      {callouts.gpio > 0.05 && (
        <TechnicalLabel
          targetX={1092}
          targetY={600}
          labelX={920}
          labelY={600}
          text="GPIO HEADERS"
          subtext="30 PINS · ADC/DAC/PWM"
          drawProgress={callouts.gpio}
          zoom={zoom}
          accent="#FFD83D"
        />
      )}

      {callouts.edge > 0.05 && (
        <TechnicalLabel
          targetX={1200}
          targetY={810}
          labelX={1200}
          labelY={910}
          text="EDGE TELEMETRY NODE"
          subtext="TARGET HARDWARE · NON-INVASIVE"
          drawProgress={callouts.edge}
          zoom={zoom}
          accent="#F4F0E6"
        />
      )}
    </g>
  );
};
