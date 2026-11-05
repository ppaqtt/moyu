import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'tictactoebattle', gameName: '井字棋对战', category: 'multiplayer', icon: '⭕' } as const;

export default function Tictactoebattle(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
