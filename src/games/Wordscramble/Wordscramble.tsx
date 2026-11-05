import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'wordscramble', gameName: '单词打乱', category: 'word', icon: '🔤' } as const;

export default function Wordscramble(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
