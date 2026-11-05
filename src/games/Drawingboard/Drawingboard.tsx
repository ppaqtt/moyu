import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'drawingboard', gameName: '涂鸦画板', category: 'craft', icon: '🎨' } as const;

export default function Drawingboard(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
