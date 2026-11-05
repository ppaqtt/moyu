import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'bridge', gameName: '桥牌', category: 'card', icon: '🌉' } as const;

export default function Bridge(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
