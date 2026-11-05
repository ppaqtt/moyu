import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'sakuraparkour', gameName: '樱花跑酷', category: 'parkour', icon: '🌸' } as const;

export default function Sakuraparkour(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
