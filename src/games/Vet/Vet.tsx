import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'vet', gameName: '兽医', category: 'career', icon: '🐕' } as const;

export default function Vet(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
