import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'cyberpunk', gameName: '赛博朋克', category: 'adventure', icon: '🤖' } as const;

export default function Cyberpunk(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
