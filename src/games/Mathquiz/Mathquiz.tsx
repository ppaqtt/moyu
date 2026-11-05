import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'mathquiz', gameName: '数学测验', category: 'education', icon: '➕' } as const;

export default function Mathquiz(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
