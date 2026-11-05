import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'pixelshooter', gameName: '像素射击', category: 'pixel', icon: '🎯' } as const;

export default function Pixelshooter(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
