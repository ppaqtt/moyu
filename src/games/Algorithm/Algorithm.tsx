import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'algorithm', gameName: '算法可视化', category: 'coding', icon: '📊' } as const;

export default function Algorithm(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
