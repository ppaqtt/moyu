import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'helicopter', gameName: '直升机驾驶', category: 'driving', icon: '🚁' } as const;

export default function Helicopter(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
