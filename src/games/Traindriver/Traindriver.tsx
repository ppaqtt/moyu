import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'traindriver', gameName: '地铁司机', category: 'driving', icon: '🚇' } as const;

export default function Traindriver(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
