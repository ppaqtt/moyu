import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'partygames', gameName: '派对小游戏合集', category: 'multiplayer', icon: '🎮' } as const;

export default function Partygames(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
