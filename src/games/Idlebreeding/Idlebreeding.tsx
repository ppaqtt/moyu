import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'idlebreeding', gameName: '放置养殖', category: 'idle', icon: '🐄' } as const;

export default function Idlebreeding(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
