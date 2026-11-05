import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'magicschool', gameName: '魔法学校', category: 'story', icon: '🧙' } as const;

export default function Magicschool(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
