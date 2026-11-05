import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'architect', gameName: '建筑师', category: 'career', icon: '🏗️' } as const;

export default function Architect(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
