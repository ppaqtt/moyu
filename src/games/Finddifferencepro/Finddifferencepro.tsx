import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'finddifferencepro', gameName: '找不同增强版', category: 'visual', icon: '🔍' } as const;

export default function Finddifferencepro(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
