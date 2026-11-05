import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'robotarena', gameName: '机器人竞技', category: 'aibattle', icon: '🤖' } as const;

export default function Robotarena(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
