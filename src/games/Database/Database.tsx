import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'database', gameName: '数据库设计', category: 'coding', icon: '🗄️' } as const;

export default function Database(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
