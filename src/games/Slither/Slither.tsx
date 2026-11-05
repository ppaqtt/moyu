import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'slither', gameName: '蛇蛇争霸', category: 'io', icon: '🐍' } as const;

export default function Slither(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
