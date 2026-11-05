import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'racingcar', gameName: '赛车手', category: 'driving', icon: '🏎️' } as const;

export default function Racingcar(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
