import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'visiontrack', gameName: '视觉追踪', category: 'visual', icon: '👁️' } as const;

export default function Visiontrack(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
