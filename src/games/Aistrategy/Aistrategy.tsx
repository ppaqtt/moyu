import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'aistrategy', gameName: '策略对战', category: 'aibattle', icon: '🧠' } as const;

export default function Aistrategy(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
