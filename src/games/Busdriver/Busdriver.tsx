import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'busdriver', gameName: '公交车司机', category: 'driving', icon: '🚌' } as const;

export default function Busdriver(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
