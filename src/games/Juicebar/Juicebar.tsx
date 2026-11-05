import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'juicebar', gameName: '果汁吧', category: 'cooking', icon: '🍹' } as const;

export default function Juicebar(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
