import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'diep', gameName: '坦克进化', category: 'io', icon: '💥' } as const;

export default function Diep(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
