import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'industrialtycoon', gameName: '工业大亨', category: 'simulation', icon: '🏭' } as const;

export default function Industrialtycoon(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
