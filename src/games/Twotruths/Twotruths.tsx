import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'twotruths', gameName: '两个真话一个谎', category: 'social', icon: '🗣️' } as const;

export default function Twotruths(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
