import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'hearts', gameName: '红心大战', category: 'card', icon: '❤️' } as const;

export default function Hearts(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
