import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'archery3d', gameName: '3D弓箭', category: '3d', icon: '🎯' } as const;

export default function Archery3d(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
