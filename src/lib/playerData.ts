import { useEffect, useState } from 'react';
import { GAMES_LIST, type GameMeta } from '../utils/constants';

export const PLAYER_DATA_EVENT = 'moyu:playerdata';

const FAVORITES_KEY = 'moyu:favorites';
const RECENT_KEY = 'moyu:recent';
const DAILY_KEY = 'moyu:daily';
const RECENT_LIMIT = 24;

export interface RecentEntry {
  id: string;
  at: number;
}

export interface DailyRecord {
  date: string;
  gameId: string;
  playedAt: number;
  bestScore: number;
}

interface PlayerSnapshot {
  favorites: string[];
  recent: RecentEntry[];
  daily: DailyRecord | null;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage 不可用时静默降级，不影响游戏运行
  }
  window.dispatchEvent(new Event(PLAYER_DATA_EVENT));
}

export function getFavorites(): string[] {
  const list = readJson<string[]>(FAVORITES_KEY, []);
  return Array.isArray(list) ? list.filter(Boolean) : [];
}

export function isFavorite(gameId: string): boolean {
  return getFavorites().includes(gameId);
}

export function toggleFavorite(gameId: string): string[] {
  const current = getFavorites();
  const next = current.includes(gameId)
    ? current.filter(id => id !== gameId)
    : [gameId, ...current];
  writeJson(FAVORITES_KEY, next);
  return next;
}

export function getRecent(): RecentEntry[] {
  const list = readJson<RecentEntry[]>(RECENT_KEY, []);
  if (!Array.isArray(list)) return [];
  return list
    .filter(item => item && typeof item.id === 'string' && typeof item.at === 'number')
    .sort((a, b) => b.at - a.at);
}

export function recordPlay(gameId: string) {
  const next = [{ id: gameId, at: Date.now() }, ...getRecent().filter(item => item.id !== gameId)]
    .slice(0, RECENT_LIMIT);
  writeJson(RECENT_KEY, next);
}

export function getHighScore(gameId: string): number {
  return parseInt(window.localStorage.getItem(`game_highscore_${gameId}`) || '0', 10) || 0;
}

function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dateKey(date = new Date()): string {
  return localDateKey(date);
}

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getDailyGame(date = new Date()): GameMeta {
  const key = localDateKey(date);
  return GAMES_LIST[hashString(key) % GAMES_LIST.length];
}

export function getDailyRecord(date = new Date()): DailyRecord | null {
  const record = readJson<DailyRecord | null>(DAILY_KEY, null);
  if (!record || record.date !== localDateKey(date)) return null;
  return record;
}

export function markDailyPlayed(gameId: string, date = new Date()): DailyRecord {
  const existing = getDailyRecord(date);
  if (existing && existing.gameId === gameId) return existing;
  const record: DailyRecord = {
    date: localDateKey(date),
    gameId,
    playedAt: Date.now(),
    bestScore: getHighScore(gameId),
  };
  writeJson(DAILY_KEY, record);
  return record;
}

export function updateDailyScore(gameId: string, bestScore: number, date = new Date()) {
  const existing = getDailyRecord(date);
  if (!existing || existing.gameId !== gameId) return;
  if (bestScore <= existing.bestScore) return;
  writeJson(DAILY_KEY, { ...existing, bestScore });
}

function readSnapshot(): PlayerSnapshot {
  return {
    favorites: getFavorites(),
    recent: getRecent(),
    daily: getDailyRecord(),
  };
}

export function usePlayerData() {
  const [snapshot, setSnapshot] = useState<PlayerSnapshot>(readSnapshot);

  useEffect(() => {
    const refresh = () => setSnapshot(readSnapshot());
    window.addEventListener(PLAYER_DATA_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(PLAYER_DATA_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return {
    ...snapshot,
    toggleFavorite,
    recordPlay,
    markDailyPlayed,
    getHighScore,
  };
}
