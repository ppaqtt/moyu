import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'burgermaker', gameName: '汉堡制作', category: 'cooking', icon: '🍔' } as const;

export default function Burgermaker(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
