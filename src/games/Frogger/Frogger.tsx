import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'frogger', gameName: '青蛙过河', category: 'retro', icon: '🐸' } as const;

export default function Frogger(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
