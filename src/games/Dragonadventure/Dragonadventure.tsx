import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'dragonadventure', gameName: '魔法冒险', category: 'story', icon: '🐉' } as const;

export default function Dragonadventure(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
