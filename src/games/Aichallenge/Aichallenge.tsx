import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'aichallenge', gameName: 'AI挑战赛', category: 'aibattle', icon: '🎯' } as const;

export default function Aichallenge(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
