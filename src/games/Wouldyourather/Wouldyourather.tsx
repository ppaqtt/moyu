import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'wouldyourather', gameName: '你宁愿', category: 'social', icon: '🤔' } as const;

export default function Wouldyourather(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
