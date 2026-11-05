import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'dogtrainer', gameName: '狗狗训练师', category: 'animal', icon: '🐕' } as const;

export default function Dogtrainer(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
