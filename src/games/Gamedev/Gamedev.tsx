import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'gamedev', gameName: '游戏开发', category: 'coding', icon: '🎮' } as const;

export default function Gamedev(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
