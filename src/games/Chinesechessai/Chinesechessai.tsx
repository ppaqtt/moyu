import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'chinesechessai', gameName: '象棋AI', category: 'ai', icon: '🀄' } as const;

export default function Chinesechessai(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
