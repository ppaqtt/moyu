import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'listening', gameName: '听力训练', category: 'language', icon: '👂' } as const;

export default function Listening(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
