import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'pinball3d', gameName: '3D弹珠台', category: '3d', icon: '🎱' } as const;

export default function Pinball3d(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
