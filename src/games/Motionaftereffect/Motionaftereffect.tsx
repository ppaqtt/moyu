import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'motionaftereffect', gameName: '运动后效', category: 'visual', icon: '🌀' } as const;

export default function Motionaftereffect(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
