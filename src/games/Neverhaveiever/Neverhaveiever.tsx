import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'neverhaveiever', gameName: '我从没做过', category: 'social', icon: '🍻' } as const;

export default function Neverhaveiever(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
