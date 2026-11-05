import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'desertruins', gameName: '沙漠遗迹', category: 'escape', icon: '🏜️' } as const;

export default function Desertruins(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
