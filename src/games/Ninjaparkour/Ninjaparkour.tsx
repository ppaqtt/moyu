import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'ninjaparkour', gameName: '忍者跑酷', category: 'parkour', icon: '🥷' } as const;

export default function Ninjaparkour(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
