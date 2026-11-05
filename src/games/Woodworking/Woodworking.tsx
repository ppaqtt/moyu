import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'woodworking', gameName: '木工制作', category: 'craft', icon: '🪵' } as const;

export default function Woodworking(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
