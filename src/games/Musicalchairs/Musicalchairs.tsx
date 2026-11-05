import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'musicalchairs', gameName: '抢椅子', category: 'party', icon: '🪑' } as const;

export default function Musicalchairs(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
