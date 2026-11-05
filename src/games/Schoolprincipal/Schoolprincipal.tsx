import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'schoolprincipal', gameName: '学校校长', category: 'simulation', icon: '🎓' } as const;

export default function Schoolprincipal(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
