import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'drivingschool', gameName: '驾校学车', category: 'driving', icon: '🚗' } as const;

export default function Drivingschool(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
