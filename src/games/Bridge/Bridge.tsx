import React from 'react';
import GameRenderer from '../shared/GameRenderer';

export default function Bridge(props: any) {
  return <GameRenderer {...props} />;
}
