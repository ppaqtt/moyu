import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'familysimulator', gameName: '家庭模拟器', category: 'simulation', icon: '👨‍👩‍👧‍👦' } as const;

export default function Familysimulator(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
