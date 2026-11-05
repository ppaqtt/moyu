import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'magicacademy', gameName: '魔法学院', category: 'escape', icon: '🎭' } as const;

export default function Magicacademy(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
