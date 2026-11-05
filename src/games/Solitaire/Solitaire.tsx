import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'solitaire', gameName: '纸牌接龙', category: 'card', icon: '🃏' } as const;

export default function Solitaire(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
