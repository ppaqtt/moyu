import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: '2048battle', gameName: '2048对战', category: 'multiplayer', icon: '🔢' } as const;

export default function Game2048Battle(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
