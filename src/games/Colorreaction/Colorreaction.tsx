import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'colorreaction', gameName: '颜色反应', category: 'reaction', icon: '🎨' } as const;

export default function Colorreaction(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
