import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'aiart', gameName: 'AI绘画', category: 'tech', icon: '🎨' } as const;

export default function Aiart(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
