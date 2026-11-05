import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'detectiveriddle', gameName: '侦探推理', category: 'story', icon: '🕵️' } as const;

export default function Detectiveriddle(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
