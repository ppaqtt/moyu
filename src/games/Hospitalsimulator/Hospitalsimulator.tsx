import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'hospitalsimulator', gameName: '医院模拟器', category: 'simulation', icon: '🏥' } as const;

export default function Hospitalsimulator(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
