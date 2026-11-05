import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'typingadvance', gameName: '打字进阶', category: 'language', icon: '⌨️' } as const;

export default function Typingadvance(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
