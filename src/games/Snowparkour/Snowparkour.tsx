import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'snowparkour', gameName: '雪山跑酷', category: 'parkour', icon: '🏔️' } as const;

export default function Snowparkour(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
