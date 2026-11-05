import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'jewelry', gameName: '珠宝制作', category: 'craft', icon: '💍' } as const;

export default function Jewelry(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
