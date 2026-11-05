import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'snakebattle', gameName: '贪吃蛇对战', category: 'multiplayer', icon: '🐍' } as const;

export default function Snakebattle(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
