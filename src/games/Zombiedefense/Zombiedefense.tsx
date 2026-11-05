import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'zombiedefense', gameName: '僵尸防线', category: 'tower', icon: '🧟' } as const;

export default function Zombiedefense(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
