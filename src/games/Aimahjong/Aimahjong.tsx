import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'aimahjong', gameName: 'AI麻将', category: 'aibattle', icon: '🀄' } as const;

export default function Aimahjong(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
