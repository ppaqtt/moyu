import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'idlefishing', gameName: '放置钓鱼', category: 'idle', icon: '🎣' } as const;

export default function Idlefishing(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
