import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'sequencer', gameName: '音序器', category: 'music', icon: '🎚️' } as const;

export default function Sequencer(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
