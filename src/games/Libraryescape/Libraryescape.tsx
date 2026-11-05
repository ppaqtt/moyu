import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'libraryescape', gameName: '图书馆逃脱', category: 'escape', icon: '📚' } as const;

export default function Libraryescape(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
