import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'dragonboat', gameName: '端午龙舟', category: 'holiday', icon: '🐉' } as const;

export default function Dragonboat(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
