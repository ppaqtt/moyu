import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'agar', gameName: '细胞吞噬', category: 'io', icon: '🔵' } as const;

export default function Agar(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
