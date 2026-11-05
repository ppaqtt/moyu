import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'numberkeys', gameName: '数字按键', category: 'reaction', icon: '🔢' } as const;

export default function Numberkeys(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
