import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'hiddenpicture', gameName: '隐藏图片', category: 'visual', icon: '🎯' } as const;

export default function Hiddenpicture(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
