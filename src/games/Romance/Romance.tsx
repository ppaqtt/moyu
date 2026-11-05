import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'romance', gameName: '浪漫故事', category: 'adventure', icon: '💕' } as const;

export default function Romance(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
