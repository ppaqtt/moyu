import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'anagram', gameName: '字母重组', category: 'word', icon: '📚' } as const;

export default function Anagram(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
