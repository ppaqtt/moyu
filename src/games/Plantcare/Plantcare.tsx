import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'plantcare', gameName: '植物养成', category: '养成', icon: '🌱' } as const;

export default function Plantcare(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
