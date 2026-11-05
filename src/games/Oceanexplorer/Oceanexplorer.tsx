import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'oceanexplorer', gameName: '海洋探索', category: 'survival', icon: '🌊' } as const;

export default function Oceanexplorer(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
