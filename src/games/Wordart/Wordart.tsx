import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'wordart', gameName: '文字艺术', category: 'creative', icon: '✍️' } as const;

export default function Wordart(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
