import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      try {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch {
        console.warn('Failed to save to localStorage');
      }
      return valueToStore;
    });
  }, [key]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch {
          setStoredValue(initialValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue];
}

export interface GameRecord {
  bestScore: number;
  totalGames: number;
  lastPlayed: string;
}

export function useGameRecord(gameId: string) {
  const [record, setRecord] = useLocalStorage<GameRecord>(gameId, {
    bestScore: 0,
    totalGames: 0,
    lastPlayed: ''
  });

  const updateScore = useCallback((score: number) => {
    setRecord(prev => ({
      bestScore: Math.max(prev.bestScore, score),
      totalGames: prev.totalGames + 1,
      lastPlayed: new Date().toISOString()
    }));
  }, [setRecord]);

  const reset = useCallback(() => {
    setRecord({ bestScore: 0, totalGames: 0, lastPlayed: '' });
  }, [setRecord]);

  return { record, updateScore, reset };
}
