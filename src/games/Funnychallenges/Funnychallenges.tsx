import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'funnychallenges', gameName: '大冒险小游戏', category: 'party', icon: '🍌' } as const;

export default function Funnychallenges(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
