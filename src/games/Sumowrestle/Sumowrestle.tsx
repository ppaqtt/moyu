import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'sumowrestle', gameName: '相扑大战', category: 'fighting', icon: '🤼' } as const;

export default function Sumowrestle(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
