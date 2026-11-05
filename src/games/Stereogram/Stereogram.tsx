import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'stereogram', gameName: '立体图', category: 'visual', icon: '🔮' } as const;

export default function Stereogram(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
