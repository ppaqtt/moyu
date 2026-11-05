import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'elementaltd', gameName: '元素塔防', category: 'tower', icon: '🔥' } as const;

export default function Elementaltd(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
