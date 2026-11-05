import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'budgeting', gameName: '理财训练', category: 'life', icon: '💰' } as const;

export default function Budgeting(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
