import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'christmasgift', gameName: '圣诞礼物', category: 'holiday', icon: '🎄' } as const;

export default function Christmasgift(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
