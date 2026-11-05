import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'desertsurvival', gameName: '沙漠生存', category: 'survival', icon: '🏜️' } as const;

export default function Desertsurvival(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
