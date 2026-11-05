import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'pixelrpg', gameName: '像素角色扮演', category: 'pixel', icon: '👾' } as const;

export default function Pixelrpg(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
