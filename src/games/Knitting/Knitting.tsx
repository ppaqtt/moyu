import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'knitting', gameName: '编织手工', category: 'craft', icon: '🧶' } as const;

export default function Knitting(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
