import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'coopshooting', gameName: '双人射击', category: 'co-op', icon: '🔫' } as const;

export default function Coopshooting(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
