import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'citybuilder', gameName: '城市建造者', category: 'simulation', icon: '🏗️' } as const;

export default function Citybuilder(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
