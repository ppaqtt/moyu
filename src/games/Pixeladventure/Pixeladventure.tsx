import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'pixeladventure', gameName: '像素冒险', category: 'pixel', icon: '🏰' } as const;

export default function Pixeladventure(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
