import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'timemachine', gameName: '时光机器', category: 'story', icon: '⏰' } as const;

export default function Timemachine(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
