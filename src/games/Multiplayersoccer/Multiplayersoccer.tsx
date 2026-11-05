import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'multiplayersoccer', gameName: '多人足球', category: 'multiplayer', icon: '🏟️' } as const;

export default function Multiplayersoccer(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
