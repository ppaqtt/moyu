import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'icecreammaker', gameName: '冰淇淋制作', category: 'cooking', icon: '🍦' } as const;

export default function Icecreammaker(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
