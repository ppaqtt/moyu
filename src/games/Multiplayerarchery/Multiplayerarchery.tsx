import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'multiplayerarchery', gameName: '多人射箭', category: 'multiplayer', icon: '🎯' } as const;

export default function Multiplayerarchery(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
