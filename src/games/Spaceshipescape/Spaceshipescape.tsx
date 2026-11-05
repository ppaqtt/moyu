import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'spaceshipescape', gameName: '太空船逃脱', category: 'escape', icon: '🚀' } as const;

export default function Spaceshipescape(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
