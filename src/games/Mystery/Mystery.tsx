import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'mystery', gameName: '悬疑探案', category: 'adventure', icon: '🔎' } as const;

export default function Mystery(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
