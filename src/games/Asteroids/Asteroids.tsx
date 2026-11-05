import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'asteroids', gameName: '小行星', category: 'retro', icon: '☄️' } as const;

export default function Asteroids(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
