import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'leather', gameName: '皮革工艺', category: 'craft', icon: '👜' } as const;

export default function Leather(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
