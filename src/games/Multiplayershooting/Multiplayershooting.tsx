import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'multiplayershooting', gameName: '多人射击赛', category: 'multiplayer', icon: '🔫' } as const;

export default function Multiplayershooting(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
