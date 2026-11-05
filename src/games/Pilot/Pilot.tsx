import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'pilot', gameName: '飞行员', category: 'career', icon: '✈️' } as const;

export default function Pilot(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
