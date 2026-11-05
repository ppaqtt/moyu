import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'tetris3d', gameName: '3D俄罗斯方块', category: '3d', icon: '🧱' } as const;

export default function Tetris3d(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
