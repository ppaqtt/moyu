import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'translatechallenge', gameName: '翻译挑战', category: 'language', icon: '🌍' } as const;

export default function Translatechallenge(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
