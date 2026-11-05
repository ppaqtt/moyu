import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'halloween', gameName: '万圣节南瓜', category: 'holiday', icon: '🎃' } as const;

export default function Halloween(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
