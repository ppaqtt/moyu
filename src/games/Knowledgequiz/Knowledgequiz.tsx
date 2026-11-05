import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'knowledgequiz', gameName: '知识问答', category: 'life', icon: '📊' } as const;

export default function Knowledgequiz(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
