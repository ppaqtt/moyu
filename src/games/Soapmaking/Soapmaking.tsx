import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'soapmaking', gameName: '手工皂', category: 'craft', icon: '🧼' } as const;

export default function Soapmaking(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
