import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'kingdomrush', gameName: '王国保卫战', category: 'tower', icon: '🏰' } as const;

export default function Kingdomrush(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
