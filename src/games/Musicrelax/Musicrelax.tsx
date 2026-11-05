import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'musicrelax', gameName: '音乐放松', category: 'life', icon: '🎵' } as const;

export default function Musicrelax(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
