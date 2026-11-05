import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'friendquiz', gameName: '朋友测验', category: 'social', icon: '👥' } as const;

export default function Friendquiz(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
