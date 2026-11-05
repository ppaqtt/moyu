import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'pixelcity', gameName: '像素城市', category: 'pixel', icon: '🏙️' } as const;

export default function Pixelcity(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
