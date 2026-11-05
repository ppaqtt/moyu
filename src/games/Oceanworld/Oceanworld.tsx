import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'oceanworld', gameName: '海底世界', category: 'animal', icon: '🐠' } as const;

export default function Oceanworld(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
