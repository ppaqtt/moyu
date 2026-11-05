import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'lantern', gameName: '元宵灯谜', category: 'holiday', icon: '🏮' } as const;

export default function Lantern(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
