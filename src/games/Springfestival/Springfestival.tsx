import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'springfestival', gameName: '春节爆竹', category: 'holiday', icon: '🧨' } as const;

export default function Springfestival(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
