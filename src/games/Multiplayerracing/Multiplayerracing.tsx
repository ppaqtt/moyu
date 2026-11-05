import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'multiplayerracing', gameName: '多人赛车', category: 'multiplayer', icon: '🏁' } as const;

export default function Multiplayerracing(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
