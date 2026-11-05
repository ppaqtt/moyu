import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'boatdriver', gameName: '船长', category: 'driving', icon: '🚤' } as const;

export default function Boatdriver(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
