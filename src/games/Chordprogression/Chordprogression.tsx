import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'chordprogression', gameName: '和弦进行器', category: 'music', icon: '🎵' } as const;

export default function Chordprogression(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
