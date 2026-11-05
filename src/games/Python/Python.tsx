import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'python', gameName: 'Python入门', category: 'coding', icon: '🐍' } as const;

export default function Python(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
