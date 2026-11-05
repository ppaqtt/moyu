import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'horror', gameName: '恐怖故事', category: 'adventure', icon: '👻' } as const;

export default function Horror(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
