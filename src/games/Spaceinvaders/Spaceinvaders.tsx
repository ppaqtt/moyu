import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'spaceinvaders', gameName: '太空侵略者', category: 'retro', icon: '👾' } as const;

export default function Spaceinvaders(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
