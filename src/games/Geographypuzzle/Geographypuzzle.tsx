import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'geographypuzzle', gameName: '地理拼图', category: 'education', icon: '🌍' } as const;

export default function Geographypuzzle(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
