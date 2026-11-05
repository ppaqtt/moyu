import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'aitournament', gameName: 'AI锦标赛', category: 'aibattle', icon: '🏆' } as const;

export default function Aitournament(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
