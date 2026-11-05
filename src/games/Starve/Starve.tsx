import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'starve', gameName: '荒野求生', category: 'io', icon: '🏕️' } as const;

export default function Starve(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
