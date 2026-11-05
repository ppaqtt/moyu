import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'raftsurvival', gameName: '木筏求生', category: 'survival', icon: '🚣' } as const;

export default function Raftsurvival(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
