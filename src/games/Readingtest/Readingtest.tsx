import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'readingtest', gameName: '阅读测试', category: 'life', icon: '📖' } as const;

export default function Readingtest(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
