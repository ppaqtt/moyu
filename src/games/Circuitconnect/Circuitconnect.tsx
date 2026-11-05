import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'circuitconnect', gameName: '电路连接', category: 'coding', icon: '⚡' } as const;

export default function Circuitconnect(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
