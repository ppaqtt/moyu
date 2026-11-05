import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'vocoder', gameName: '声码器', category: 'music', icon: '🎤' } as const;

export default function Vocoder(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
