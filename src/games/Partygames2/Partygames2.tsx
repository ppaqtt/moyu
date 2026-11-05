import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'partygames2', gameName: '聚会游戏', category: 'party', icon: '🎉' } as const;

export default function Partygames2(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
