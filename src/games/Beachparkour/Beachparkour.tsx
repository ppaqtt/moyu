import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'beachparkour', gameName: '海滩跑酷', category: 'parkour', icon: '🏖️' } as const;

export default function Beachparkour(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
