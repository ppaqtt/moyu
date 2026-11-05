import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'neonparkour', gameName: '霓虹跑酷', category: 'parkour', icon: '🌃' } as const;

export default function Neonparkour(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
