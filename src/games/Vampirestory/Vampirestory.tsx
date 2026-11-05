import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'vampirestory', gameName: '吸血鬼故事', category: 'story', icon: '🧛' } as const;

export default function Vampirestory(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
