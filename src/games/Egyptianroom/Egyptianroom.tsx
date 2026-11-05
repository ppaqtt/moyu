import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'egyptianroom', gameName: '古埃及密室', category: 'escape', icon: '🏛️' } as const;

export default function Egyptianroom(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
