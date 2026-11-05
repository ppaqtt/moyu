import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'dogcare', gameName: '狗狗养成', category: '养成', icon: '🐕' } as const;

export default function Dogcare(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
