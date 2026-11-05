import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'zooescape', gameName: '动物园保卫战', category: 'animal', icon: '🐒' } as const;

export default function Zooescape(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
