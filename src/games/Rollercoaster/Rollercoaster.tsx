import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'rollercoaster', gameName: '3D过山车', category: '3d', icon: '🎡' } as const;

export default function Rollercoaster(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
