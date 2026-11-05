import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'memorytraining', gameName: '记忆力训练', category: 'life', icon: '🧠' } as const;

export default function Memorytraining(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
