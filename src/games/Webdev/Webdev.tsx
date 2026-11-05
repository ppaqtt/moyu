import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'webdev', gameName: '网页开发', category: 'coding', icon: '🌐' } as const;

export default function Webdev(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
