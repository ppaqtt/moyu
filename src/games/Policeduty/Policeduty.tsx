import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'policeduty', gameName: '警察出警', category: 'career', icon: '👮' } as const;

export default function Policeduty(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
