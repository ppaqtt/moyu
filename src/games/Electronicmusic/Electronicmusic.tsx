import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'electronicmusic', gameName: '电子音乐制作', category: 'tech', icon: '🎵' } as const;

export default function Electronicmusic(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
