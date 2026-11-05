import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'illusionart', gameName: '错觉绘画', category: 'visual', icon: '🎨' } as const;

export default function Illusionart(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
