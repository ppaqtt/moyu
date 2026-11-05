import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'bloonstd', gameName: '气球塔防', category: 'tower', icon: '🎈' } as const;

export default function Bloonstd(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
