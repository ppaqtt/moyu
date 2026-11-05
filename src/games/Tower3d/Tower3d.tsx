import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'tower3d', gameName: '3D塔防', category: '3d', icon: '🏰' } as const;

export default function Tower3d(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
