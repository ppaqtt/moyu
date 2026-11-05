import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'backgammon', gameName: '双陆棋', category: 'ai', icon: '🎲' } as const;

export default function Backgammon(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
