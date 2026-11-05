import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'firefighter', gameName: '消防员', category: 'career', icon: '🚒' } as const;

export default function Firefighter(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
