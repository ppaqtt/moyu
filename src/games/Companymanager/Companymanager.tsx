import React from 'react';
import ArcadeGame, { ArcadeGameProps } from '../shared/ArcadeGame';

const META = { gameId: 'companymanager', gameName: '公司经营', category: 'simulation', icon: '🏢' } as const;

export default function Companymanager(props: ArcadeGameProps) {
  return <ArcadeGame {...props} {...META} />;
}
