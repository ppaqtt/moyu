import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'coopadventure', gameName: '多人闯关冒险', category: 'multiplayer', icon: '🗺️' } as const;

export default function Coopadventure(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
