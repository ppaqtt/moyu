import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'interactivemovie', gameName: '互动电影', category: 'story', icon: '🎬' } as const;

export default function Interactivemovie(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
