import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'catstory', gameName: '猫咪物语', category: 'animal', icon: '🐱' } as const;

export default function Catstory(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
