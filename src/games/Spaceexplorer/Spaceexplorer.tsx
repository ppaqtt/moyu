import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'spaceexplorer', gameName: '太空探索者', category: 'tech', icon: '🔭' } as const;

export default function Spaceexplorer(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
