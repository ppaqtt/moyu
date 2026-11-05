import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'idleforest', gameName: '放置森林', category: 'idle', icon: '🌳' } as const;

export default function Idleforest(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
