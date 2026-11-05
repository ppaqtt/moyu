import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'pixelsurvival', gameName: '像素生存', category: 'pixel', icon: '🏕️' } as const;

export default function Pixelsurvival(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
