import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'colorblind', gameName: '色盲测试', category: 'visual', icon: '🎨' } as const;

export default function Colorblind(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
