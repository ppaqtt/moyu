import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'laborday', gameName: '劳动节', category: 'holiday', icon: '👷' } as const;

export default function Laborday(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
