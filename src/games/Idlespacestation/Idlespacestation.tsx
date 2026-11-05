import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'idlespacestation', gameName: '放置太空站', category: 'idle', icon: '🚀' } as const;

export default function Idlespacestation(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
