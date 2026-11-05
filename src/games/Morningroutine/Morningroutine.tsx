import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'morningroutine', gameName: '晨间习惯', category: 'life', icon: '🌅' } as const;

export default function Morningroutine(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
