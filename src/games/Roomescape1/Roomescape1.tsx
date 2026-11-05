import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'roomescape1', gameName: '密室逃脱1', category: 'escape', icon: '🚪' } as const;

export default function Roomescape1(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
