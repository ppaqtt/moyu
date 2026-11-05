import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'embroidery', gameName: '刺绣', category: 'craft', icon: '🧵' } as const;

export default function Embroidery(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
