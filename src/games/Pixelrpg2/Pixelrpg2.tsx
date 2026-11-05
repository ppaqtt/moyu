import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'pixelrpg2', gameName: '像素RPG2', category: 'pixel', icon: '⚔️' } as const;

export default function Pixelrpg2(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
