import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'pottery', gameName: '陶艺', category: 'craft', icon: '🍶' } as const;

export default function Pottery(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
