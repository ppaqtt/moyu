import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'reading', gameName: '阅读理解', category: 'language', icon: '📖' } as const;

export default function Reading(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
