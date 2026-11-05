import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'doctor', gameName: '医生', category: 'career', icon: '🚑' } as const;

export default function Doctor(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
