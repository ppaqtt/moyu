import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'cakemaker', gameName: '蛋糕制作', category: 'cooking', icon: '🧁' } as const;

export default function Cakemaker(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
