import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'beatbox', gameName: '节拍盒子', category: 'music', icon: '🥁' } as const;

export default function Beatbox(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
