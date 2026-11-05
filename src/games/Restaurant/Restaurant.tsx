import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'restaurant', gameName: '餐厅经营', category: 'simulation', icon: '🍽️' } as const;

export default function Restaurant(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
