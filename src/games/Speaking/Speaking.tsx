import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'speaking', gameName: '口语练习', category: 'language', icon: '🗣️' } as const;

export default function Speaking(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
