import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'arcticsurvival', gameName: '极地生存', category: 'survival', icon: '❄️' } as const;

export default function Arcticsurvival(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
