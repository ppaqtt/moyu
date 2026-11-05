import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'pool3d', gameName: '3D台球', category: '3d', icon: '🎱' } as const;

export default function Pool3d(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
