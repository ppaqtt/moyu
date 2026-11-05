import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'charades', gameName: '你演我猜', category: 'social', icon: '🎭' } as const;

export default function Charades(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
