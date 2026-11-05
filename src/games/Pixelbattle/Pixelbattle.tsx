import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'pixelbattle', gameName: '像素战斗', category: 'pixel', icon: '⚔️' } as const;

export default function Pixelbattle(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
