import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'ai2048', gameName: 'AI 2048', category: 'aibattle', icon: '🔢' } as const;

export default function Ai2048(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
