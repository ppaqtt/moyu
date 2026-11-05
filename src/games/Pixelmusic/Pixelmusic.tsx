import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'pixelmusic', gameName: '像素音乐游戏', category: 'pixel', icon: '🎵' } as const;

export default function Pixelmusic(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
