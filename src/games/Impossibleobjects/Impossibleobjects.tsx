import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'impossibleobjects', gameName: '不可能图形', category: 'visual', icon: '🔲' } as const;

export default function Impossibleobjects(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
