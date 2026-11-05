import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'quantum', gameName: '量子实验室', category: 'tech', icon: '⚛️' } as const;

export default function Quantum(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
