import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'tetris99', gameName: '俄罗斯方块', category: 'retro', icon: '🧱' } as const;

export default function Tetris99(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
