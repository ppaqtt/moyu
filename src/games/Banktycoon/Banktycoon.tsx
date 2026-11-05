import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'banktycoon', gameName: '银行大亨', category: 'simulation', icon: '🏦' } as const;

export default function Banktycoon(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
