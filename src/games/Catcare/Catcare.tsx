import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'catcare', gameName: '猫咪养成', category: '养成', icon: '🐱' } as const;

export default function Catcare(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
