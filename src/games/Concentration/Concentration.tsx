import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'concentration', gameName: '专注力训练', category: 'life', icon: '🎯' } as const;

export default function Concentration(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
