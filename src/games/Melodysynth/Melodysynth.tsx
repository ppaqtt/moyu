import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'melodysynth', gameName: '旋律合成器', category: 'music', icon: '🎶' } as const;

export default function Melodysynth(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
