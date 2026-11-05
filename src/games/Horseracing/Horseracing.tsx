import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'horseracing', gameName: '赛马', category: 'animal', icon: '🐴' } as const;

export default function Horseracing(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
