import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'nationalday', gameName: '国庆庆典', category: 'holiday', icon: '🇨🇳' } as const;

export default function Nationalday(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
