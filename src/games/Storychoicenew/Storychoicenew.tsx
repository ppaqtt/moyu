import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'storychoicenew', gameName: '剧情选择游戏', category: 'story', icon: '📖' } as const;

export default function Storychoicenew(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
