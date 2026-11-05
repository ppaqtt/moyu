import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'spacebuild', gameName: '太空建造', category: 'tech', icon: '🛸' } as const;

export default function Spacebuild(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
