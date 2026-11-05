import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'negotiation', gameName: '谈判模拟', category: 'aibattle', icon: '💼' } as const;

export default function Negotiation(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
