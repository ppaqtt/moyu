import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'beateditor', gameName: '节奏编辑器', category: 'music', icon: '🎹' } as const;

export default function Beateditor(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
