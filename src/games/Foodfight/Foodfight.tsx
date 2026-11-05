import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'foodfight', gameName: '食物大战', category: 'party', icon: '🍫' } as const;

export default function Foodfight(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
