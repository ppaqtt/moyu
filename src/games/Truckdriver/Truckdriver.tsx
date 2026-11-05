import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'truckdriver', gameName: '卡车运输', category: 'driving', icon: '🚙' } as const;

export default function Truckdriver(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
