import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'dogstory', gameName: '狗狗物语', category: 'animal', icon: '🐕' } as const;

export default function Dogstory(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
