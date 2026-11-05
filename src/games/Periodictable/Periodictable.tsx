import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'periodictable', gameName: '化学元素周期表', category: 'education', icon: '🧪' } as const;

export default function Periodictable(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
