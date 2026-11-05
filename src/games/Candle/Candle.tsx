import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'candle', gameName: '蜡烛制作', category: 'craft', icon: '🕯️' } as const;

export default function Candle(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
