import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'opticalillusion', gameName: '光学错觉', category: 'visual', icon: '👁️' } as const;

export default function Opticalillusion(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
