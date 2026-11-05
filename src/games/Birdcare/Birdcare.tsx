import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'birdcare', gameName: '小鸟养成', category: '养成', icon: '🐦' } as const;

export default function Birdcare(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
