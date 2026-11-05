import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'mope', gameName: '动物进化', category: 'io', icon: '🐾' } as const;

export default function Mope(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
