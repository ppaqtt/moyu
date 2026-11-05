import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'coffeelatte', gameName: '咖啡拉花', category: 'cooking', icon: '☕' } as const;

export default function Coffeelatte(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
