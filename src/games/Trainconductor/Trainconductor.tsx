import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'trainconductor', gameName: '火车司机', category: 'career', icon: '🚂' } as const;

export default function Trainconductor(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
