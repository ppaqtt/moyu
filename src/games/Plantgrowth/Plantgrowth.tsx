import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'plantgrowth', gameName: '植物生长', category: 'education', icon: '🌱' } as const;

export default function Plantgrowth(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
