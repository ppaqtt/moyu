import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'farmbuild', gameName: '农场建造', category: 'simulation', icon: '🌾' } as const;

export default function Farmbuild(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
