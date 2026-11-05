import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'pixelplatformer', gameName: '像素平台跳跃', category: 'pixel', icon: '🌙' } as const;

export default function Pixelplatformer(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
