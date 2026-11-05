import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'typingmasterpro', gameName: '打字大师Pro', category: 'life', icon: '✍️' } as const;

export default function Typingmasterpro(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
