import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'housebuilder', gameName: '房屋建造者', category: 'simulation', icon: '🏘️' } as const;

export default function Housebuilder(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
