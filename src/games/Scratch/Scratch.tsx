import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'scratch', gameName: '图形编程', category: 'coding', icon: '🐱' } as const;

export default function Scratch(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
