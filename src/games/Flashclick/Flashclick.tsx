import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'flashclick', gameName: '闪烁点击', category: 'reaction', icon: '👆' } as const;

export default function Flashclick(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
