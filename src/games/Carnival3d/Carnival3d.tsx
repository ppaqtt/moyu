import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'carnival3d', gameName: '3D嘉年华', category: '3d', icon: '🎪' } as const;

export default function Carnival3d(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
