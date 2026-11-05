import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'galaga', gameName: '大蜜蜂', category: 'retro', icon: '🐝' } as const;

export default function Galaga(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
