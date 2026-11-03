import { useCallback, useState } from 'react';
import type { EngineProps } from './types';

export function useGameSession(meta: EngineProps['meta'], onScore?: (n: number) => void, onGameOver?: (n: number) => void) {
  const key = `game_highscore_${meta.id}`;
  const [best, setBest] = useState<number>(() => {
    try {
      return Number(window.localStorage.getItem(key) || 0);
    } catch {
      return 0;
    }
  });

  const report = useCallback((score: number) => {
    onScore?.(score);
  }, [onScore]);

  const finish = useCallback((score: number) => {
    onScore?.(score);
    onGameOver?.(score);
    setBest(prev => {
      if (score <= prev) return prev;
      try {
        window.localStorage.setItem(key, String(score));
      } catch {
        /* ignore */
      }
      return score;
    });
  }, [key, onScore, onGameOver]);

  return { best, report, finish };
}
