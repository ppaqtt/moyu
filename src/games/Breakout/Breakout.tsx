import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'breakout', gameName: '打砖块', category: 'retro', icon: '🧱' } as const;

export default function Breakout(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
