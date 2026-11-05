import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'writing', gameName: '写作练习', category: 'language', icon: '✏️' } as const;

export default function Writing(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
