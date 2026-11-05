import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'wordmemory', gameName: '单词记忆', category: 'language', icon: '📚' } as const;

export default function Wordmemory(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
