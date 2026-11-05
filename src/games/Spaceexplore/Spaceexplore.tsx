import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'spaceexplore', gameName: '太空探索', category: 'education', icon: '🔭' } as const;

export default function Spaceexplore(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
