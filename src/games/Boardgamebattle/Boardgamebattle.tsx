import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'boardgamebattle', gameName: '棋盘大作战', category: 'multiplayer', icon: '🎲' } as const;

export default function Boardgamebattle(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
