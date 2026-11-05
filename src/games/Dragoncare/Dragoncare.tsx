import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'dragoncare', gameName: '龙宝宝养成', category: '养成', icon: '🐉' } as const;

export default function Dragoncare(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
