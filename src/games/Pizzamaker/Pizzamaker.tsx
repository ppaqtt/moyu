import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'pizzamaker', gameName: '披萨达人', category: 'cooking', icon: '🍕' } as const;

export default function Pizzamaker(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
