import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'fantasy', gameName: '奇幻冒险', category: 'adventure', icon: '🐉' } as const;

export default function Fantasy(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
