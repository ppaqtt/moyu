import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'funnychallenge', gameName: '搞笑挑战', category: 'party', icon: '🤡' } as const;

export default function Funnychallenge(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
