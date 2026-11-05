import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'butterflyvalley', gameName: '蝴蝶谷', category: 'animal', icon: '🦋' } as const;

export default function Butterflyvalley(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
