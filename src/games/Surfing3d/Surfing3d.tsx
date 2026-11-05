import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'surfing3d', gameName: '3D冲浪', category: '3d', icon: '🏄' } as const;

export default function Surfing3d(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
