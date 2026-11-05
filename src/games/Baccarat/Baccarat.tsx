import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'baccarat', gameName: '百家乐', category: 'card', icon: '🎰' } as const;

export default function Baccarat(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
