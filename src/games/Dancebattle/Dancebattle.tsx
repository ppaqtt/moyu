import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'dancebattle', gameName: '斗舞', category: 'party', icon: '💃' } as const;

export default function Dancebattle(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
