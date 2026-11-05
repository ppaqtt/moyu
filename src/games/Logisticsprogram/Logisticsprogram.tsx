import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'logisticsprogram', gameName: '物流编程', category: 'coding', icon: '🚚' } as const;

export default function Logisticsprogram(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
