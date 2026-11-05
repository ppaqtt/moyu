import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'airockpaperscissors', gameName: 'AI猜拳', category: 'aibattle', icon: '✊' } as const;

export default function Airockpaperscissors(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
