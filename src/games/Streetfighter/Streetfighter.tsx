import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'streetfighter', gameName: '街头霸王', category: 'fighting', icon: '🥊' } as const;

export default function Streetfighter(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
