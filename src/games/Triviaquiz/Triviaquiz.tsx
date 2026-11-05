import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'triviaquiz', gameName: '趣味问答', category: 'party', icon: '🎪' } as const;

export default function Triviaquiz(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
