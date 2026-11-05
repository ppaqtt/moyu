import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'soupchef', gameName: '汤品大师', category: 'cooking', icon: '🍲' } as const;

export default function Soupchef(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
