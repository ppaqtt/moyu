import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'duckhunt', gameName: '打鸭子', category: 'retro', icon: '🦆' } as const;

export default function Duckhunt(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
