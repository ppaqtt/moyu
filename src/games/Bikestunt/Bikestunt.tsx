import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'bikestunt', gameName: '自行车特技', category: 'driving', icon: '🚲' } as const;

export default function Bikestunt(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
