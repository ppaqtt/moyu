import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'dotsandboxes', gameName: '点格棋', category: 'ai', icon: '⬜' } as const;

export default function Dotsandboxes(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
