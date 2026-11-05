import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'pixelart', gameName: '像素画', category: 'pixel', icon: '🎨' } as const;

export default function Pixelart(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
