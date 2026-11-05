import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'historytime', gameName: '历史时间线', category: 'education', icon: '📜' } as const;

export default function Historytime(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
