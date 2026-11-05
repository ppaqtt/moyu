import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'wordcross', gameName: '单词接龙', category: 'word', icon: '🔤' } as const;

export default function Wordcross(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
