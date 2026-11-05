import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'vrgame', gameName: 'VR体验', category: 'tech', icon: '🥽' } as const;

export default function Vrgame(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
