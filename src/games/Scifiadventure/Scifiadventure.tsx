import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'scifiadventure', gameName: '科幻冒险', category: 'story', icon: '🌌' } as const;

export default function Scifiadventure(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
