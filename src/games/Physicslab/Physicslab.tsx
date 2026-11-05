import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'physicslab', gameName: '物理实验室', category: 'education', icon: '🔬' } as const;

export default function Physicslab(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
