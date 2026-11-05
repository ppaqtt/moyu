import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'plantswar', gameName: '植物战争', category: 'tower', icon: '🌻' } as const;

export default function Plantswar(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
