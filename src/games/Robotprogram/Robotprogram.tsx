import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'robotprogram', gameName: '机器人编程', category: 'coding', icon: '🤖' } as const;

export default function Robotprogram(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
