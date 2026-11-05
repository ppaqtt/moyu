import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'nanotech', gameName: '纳米技术', category: 'tech', icon: '🔬' } as const;

export default function Nanotech(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
