import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'detectivestory', gameName: '侦探破案游戏', category: 'story', icon: '🔍' } as const;

export default function Detectivestory(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
