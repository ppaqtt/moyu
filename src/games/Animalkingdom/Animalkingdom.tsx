import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'animalkingdom', gameName: '动物王国', category: 'education', icon: '🦁' } as const;

export default function Animalkingdom(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
