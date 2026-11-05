import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'chefmaster', gameName: '厨师长', category: 'career', icon: '👨‍🍳' } as const;

export default function Chefmaster(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
