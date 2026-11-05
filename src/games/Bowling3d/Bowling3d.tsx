import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'bowling3d', gameName: '3D保龄球', category: '3d', icon: '🎳' } as const;

export default function Bowling3d(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
