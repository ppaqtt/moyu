import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'taxidriver', gameName: '出租车司机', category: 'driving', icon: '🚕' } as const;

export default function Taxidriver(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
