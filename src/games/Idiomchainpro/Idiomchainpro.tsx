import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'idiomchainpro', gameName: '成语接龙增强版', category: 'language', icon: '📖' } as const;

export default function Idiomchainpro(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
