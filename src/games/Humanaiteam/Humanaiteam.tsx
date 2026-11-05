import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'humanaiteam', gameName: '人机协作', category: 'aibattle', icon: '🤝' } as const;

export default function Humanaiteam(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
