import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'ambiguousfigure', gameName: '歧义图形', category: 'visual', icon: '🎭' } as const;

export default function Ambiguousfigure(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
