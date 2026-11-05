import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'gomoku', gameName: '五子棋Pro', category: 'ai', icon: '⚪' } as const;

export default function Gomoku(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
