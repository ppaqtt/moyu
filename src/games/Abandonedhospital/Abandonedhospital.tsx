import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'abandonedhospital', gameName: '废弃医院', category: 'escape', icon: '🏥' } as const;

export default function Abandonedhospital(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
