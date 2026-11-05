import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'mortalcombat', gameName: '真人快打', category: 'fighting', icon: '💀' } as const;

export default function Mortalcombat(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
