import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'musicstudio', gameName: '音乐工作室', category: 'music', icon: '🎧' } as const;

export default function Musicstudio(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
