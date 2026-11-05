import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'sushimaker', gameName: '寿司师傅', category: 'cooking', icon: '🍣' } as const;

export default function Sushimaker(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
