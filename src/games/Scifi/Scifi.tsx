import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'scifi', gameName: '科幻故事', category: 'adventure', icon: '🚀' } as const;

export default function Scifi(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
