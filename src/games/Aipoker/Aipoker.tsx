import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'aipoker', gameName: 'AI扑克', category: 'aibattle', icon: '🃏' } as const;

export default function Aipoker(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
