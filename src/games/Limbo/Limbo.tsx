import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'limbo', gameName: '凌波舞', category: 'party', icon: '🎵' } as const;

export default function Limbo(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
