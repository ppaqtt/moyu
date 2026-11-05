import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'deliveryman', gameName: '快递员', category: 'career', icon: '📦' } as const;

export default function Deliveryman(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
