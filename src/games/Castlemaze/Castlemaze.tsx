import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'castlemaze', gameName: '城堡迷宫', category: 'escape', icon: '🏰' } as const;

export default function Castlemaze(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
