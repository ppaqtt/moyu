import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'kungfumaster', gameName: '功夫大师', category: 'fighting', icon: '🐉' } as const;

export default function Kungfumaster(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
