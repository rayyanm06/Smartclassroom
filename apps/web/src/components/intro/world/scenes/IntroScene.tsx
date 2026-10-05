import React, { useRef } from 'react';
import { useTrack } from '../../engine/useTrack';
import { W, seg } from '../../engine/timeline';
import { ClassroomIllustration } from '../hardware/ClassroomIllustration';

interface IntroSceneProps {
  zoom?: number;
}

export const IntroScene: React.FC<IntroSceneProps> = ({ zoom = 1 }) => {
  const groupRef = useRef<SVGGElement>(null);

  useTrack((p) => {
    // Visible 0 to 18
    if (p > 18) {
      if (groupRef.current) groupRef.current.setAttribute('visibility', 'hidden');
      return;
    }
    if (groupRef.current) groupRef.current.setAttribute('visibility', 'visible');

    // Room annotations draw in 3 -> 7
    const annotProgress = seg(p, W.introAnnot[0], W.introAnnot[1]);
    const annotEl = groupRef.current?.querySelector<SVGGElement>('#room-annotations');
    if (annotEl) {
      annotEl.style.opacity = `${annotProgress}`;
      annotEl.setAttribute('visibility', annotProgress > 0.02 ? 'visible' : 'hidden');
    }

    // Room ghosts from 100% to 16% over 8 -> 14
    const ghostT = seg(p, W.roomGhost[0], W.roomGhost[1]);
    const opacity = 1.0 - ghostT * 0.84;

    if (groupRef.current) {
      groupRef.current.style.opacity = `${opacity}`;
    }
  });

  return (
    <g ref={groupRef} id="scene-01-intro">
      <ClassroomIllustration zoom={zoom} />
    </g>
  );
};
