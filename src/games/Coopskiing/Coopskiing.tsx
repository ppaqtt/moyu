import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'coopskiing', gameName: '双人滑雪', category: 'co-op', icon: '⛷️' } as const;

export default function Coopskiing(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
