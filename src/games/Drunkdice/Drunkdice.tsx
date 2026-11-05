import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'drunkdice', gameName: '醉酒骰子', category: 'party', icon: '🎲' } as const;

export default function Drunkdice(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
