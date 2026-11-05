import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'grammar', gameName: '语法练习', category: 'language', icon: '✍️' } as const;

export default function Grammar(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
