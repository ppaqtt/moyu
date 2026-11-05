import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'golf', gameName: '高尔夫球', category: 'sports', icon: '⛳' } as const;

export default function Golf(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
