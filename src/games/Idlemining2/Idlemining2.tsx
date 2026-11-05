import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'idlemining2', gameName: '放置采矿2', category: 'idle', icon: '⛏️' } as const;

export default function Idlemining2(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
