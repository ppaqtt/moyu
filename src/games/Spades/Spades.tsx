import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'spades', gameName: '黑桃皇后', category: 'card', icon: '♠️' } as const;

export default function Spades(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
