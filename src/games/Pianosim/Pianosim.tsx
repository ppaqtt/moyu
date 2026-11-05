import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'pianosim', gameName: '钢琴模拟器', category: 'music', icon: '🎹' } as const;

export default function Pianosim(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
