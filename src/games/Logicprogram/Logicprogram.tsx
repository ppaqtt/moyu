import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'logicprogram', gameName: '逻辑编程', category: 'coding', icon: '🧠' } as const;

export default function Logicprogram(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
