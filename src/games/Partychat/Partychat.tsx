import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'partychat', gameName: '派对聊天', category: 'social', icon: '💬' } as const;

export default function Partychat(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
