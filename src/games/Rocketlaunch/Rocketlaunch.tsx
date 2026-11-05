import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'rocketlaunch', gameName: '火箭发射', category: 'driving', icon: '🚀' } as const;

export default function Rocketlaunch(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
