import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'valentine', gameName: '情人节爱心', category: 'holiday', icon: '💝' } as const;

export default function Valentine(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
