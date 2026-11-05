import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'wordpuzzle', gameName: '文字解谜', category: 'word', icon: '📝' } as const;

export default function Wordpuzzle(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
