import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'bomberman', gameName: '炸弹人', category: 'retro', icon: '💣' } as const;

export default function Bomberman(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
