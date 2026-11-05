import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'tekken', gameName: '铁拳', category: 'fighting', icon: '👊' } as const;

export default function Tekken(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
