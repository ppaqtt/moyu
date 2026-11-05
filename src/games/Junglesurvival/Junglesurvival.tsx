import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'junglesurvival', gameName: '丛林生存', category: 'survival', icon: '🌴' } as const;

export default function Junglesurvival(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
