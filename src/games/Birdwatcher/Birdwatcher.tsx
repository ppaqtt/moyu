import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'birdwatcher', gameName: '观鸟者', category: 'animal', icon: '🦜' } as const;

export default function Birdwatcher(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
