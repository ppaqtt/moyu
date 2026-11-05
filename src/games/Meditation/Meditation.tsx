import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'meditation', gameName: '冥想放松', category: 'life', icon: '🧘' } as const;

export default function Meditation(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
