import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'snakeremake', gameName: '贪吃蛇复刻', category: 'retro', icon: '🐍' } as const;

export default function Snakeremake(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
