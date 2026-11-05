import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'geneedit', gameName: '基因工程', category: 'tech', icon: '🧬' } as const;

export default function Geneedit(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
