import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'holidayjigsaw', gameName: '节日拼图', category: 'holiday', icon: '🧩' } as const;

export default function Holidayjigsaw(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
