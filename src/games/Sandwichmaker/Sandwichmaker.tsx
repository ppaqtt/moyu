import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'sandwichmaker', gameName: '三明治制作', category: 'cooking', icon: '🥪' } as const;

export default function Sandwichmaker(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
