import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'undersealab', gameName: '海底实验室', category: 'escape', icon: '🌊' } as const;

export default function Undersealab(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
