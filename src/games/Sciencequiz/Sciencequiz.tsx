import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'sciencequiz', gameName: '科学测验', category: 'education', icon: '🔍' } as const;

export default function Sciencequiz(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
