import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'midautumn', gameName: '中秋月饼', category: 'holiday', icon: '🥮' } as const;

export default function Midautumn(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
