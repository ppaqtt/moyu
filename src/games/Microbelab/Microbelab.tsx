import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'microbelab', gameName: '微生物实验室', category: 'education', icon: '🦠' } as const;

export default function Microbelab(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
