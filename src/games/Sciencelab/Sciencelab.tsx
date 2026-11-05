import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'sciencelab', gameName: '科学实验', category: 'tech', icon: '🔬' } as const;

export default function Sciencelab(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
