import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'beekeeper', gameName: '养蜂人', category: 'animal', icon: '🐝' } as const;

export default function Beekeeper(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
