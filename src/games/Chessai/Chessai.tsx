import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'chessai', gameName: '国际象棋AI', category: 'ai', icon: '♔' } as const;

export default function Chessai(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
