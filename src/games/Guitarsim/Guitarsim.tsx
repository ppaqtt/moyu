import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'guitarsim', gameName: '吉他模拟器', category: 'music', icon: '🎸' } as const;

export default function Guitarsim(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
