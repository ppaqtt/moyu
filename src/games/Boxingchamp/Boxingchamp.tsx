import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'boxingchamp', gameName: '拳击冠军', category: 'fighting', icon: '🥊' } as const;

export default function Boxingchamp(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
