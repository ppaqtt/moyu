import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'parkour3d', gameName: '3D跑酷', category: '3d', icon: '🌍' } as const;

export default function Parkour3d(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
