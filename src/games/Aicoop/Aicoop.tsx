import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'aicoop', gameName: 'AI合作闯关', category: 'aibattle', icon: '🎮' } as const;

export default function Aicoop(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
