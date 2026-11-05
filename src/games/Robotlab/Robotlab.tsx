import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'robotlab', gameName: '机器人实验室', category: 'tech', icon: '🤖' } as const;

export default function Robotlab(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
