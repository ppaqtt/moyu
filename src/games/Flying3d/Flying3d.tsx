import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'flying3d', gameName: '3D飞行', category: '3d', icon: '🏜️' } as const;

export default function Flying3d(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
