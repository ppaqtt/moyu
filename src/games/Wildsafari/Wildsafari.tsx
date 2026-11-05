import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'wildsafari', gameName: '野生动物园', category: 'animal', icon: '🦁' } as const;

export default function Wildsafari(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
