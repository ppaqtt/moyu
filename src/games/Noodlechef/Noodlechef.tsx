import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'noodlechef', gameName: '面条大师', category: 'cooking', icon: '🍜' } as const;

export default function Noodlechef(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
