import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'cooptetris', gameName: '双人俄罗斯方块', category: 'co-op', icon: '🧱' } as const;

export default function Cooptetris(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
