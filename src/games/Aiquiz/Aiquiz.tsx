import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'aiquiz', gameName: 'AI问答', category: 'aibattle', icon: '🤔' } as const;

export default function Aiquiz(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
