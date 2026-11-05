import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'tictactoemaster', gameName: '井字棋大师', category: 'ai', icon: '⭕' } as const;

export default function Tictactoemaster(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
