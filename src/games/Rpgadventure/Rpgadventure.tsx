import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'rpgadventure', gameName: '角色扮演游戏', category: 'story', icon: '🎭' } as const;

export default function Rpgadventure(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
