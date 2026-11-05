import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'timezone', gameName: '时间管理', category: 'life', icon: '⏱️' } as const;

export default function Timezone(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
