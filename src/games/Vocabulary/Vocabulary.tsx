import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'vocabulary', gameName: '词汇量测试', category: 'language', icon: '📚' } as const;

export default function Vocabulary(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
