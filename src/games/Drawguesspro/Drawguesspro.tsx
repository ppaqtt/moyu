import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'drawguesspro', gameName: '你画我猜Pro', category: 'party', icon: '🎨' } as const;

export default function Drawguesspro(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
