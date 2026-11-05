import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'origami', gameName: '折纸艺术', category: 'craft', icon: '✂️' } as const;

export default function Origami(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
