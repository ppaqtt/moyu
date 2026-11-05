import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'drummachine', gameName: '鼓机', category: 'music', icon: '🥁' } as const;

export default function Drummachine(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
