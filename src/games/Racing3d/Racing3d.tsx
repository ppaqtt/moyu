import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'racing3d', gameName: '3D赛车', category: '3d', icon: '🏎️' } as const;

export default function Racing3d(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
