import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'teacher', gameName: '老师', category: 'career', icon: '👩‍🏫' } as const;

export default function Teacher(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
