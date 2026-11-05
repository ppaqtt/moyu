import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'leftrightchoice', gameName: '左右抉择', category: 'reaction', icon: '⬅️➡️' } as const;

export default function Leftrightchoice(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
