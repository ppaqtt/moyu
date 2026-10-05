import { useEffect, useState } from 'react';

/**
 * 排行榜数据层
 *
 * 数据全部存放在 localStorage：
 *  - 玩家昵称： moyu_player_name
 *  - 单游戏榜： moyu_leaderboard_<gameId>  =>  { name, score, date }[]
 *
 * 同一昵称在同一游戏只保留最高分。变更后派发事件，页面可实时刷新。
 */

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export interface GlobalRankItem {
  name: string;
  totalScore: number;
  gamesPlayed: number;
  bestScore: number;
}

export const DEFAULT_PLAYER_NAME = '匿名玩家';

const NAME_KEY = 'moyu_player_name';
const LB_PREFIX = 'moyu_leaderboard_';
const MAX_ENTRIES = 20;
const EVT = 'moyu-leaderboard-updated';

function emit(): void {
  try {
    window.dispatchEvent(new Event(EVT));
  } catch {
    /* ignore */
  }
}

export function getPlayerName(): string {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
}

export function setPlayerName(name: string): void {
  try {
    const trimmed = name.trim().slice(0, 12);
    if (trimmed) localStorage.setItem(NAME_KEY, trimmed);
    else localStorage.removeItem(NAME_KEY);
  } catch {
    /* ignore */
  }
  emit();
}

export function getLeaderboard(gameId: string): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LB_PREFIX + gameId);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list
      .filter((e: any) => e && typeof e.score === 'number')
      .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score);
  } catch {
    return [];
  }
}

/** 记录一次成绩：同一昵称仅保留最高分 */
export function recordScore(gameId: string, score: number): void {
  if (!gameId || typeof score !== 'number' || !isFinite(score)) return;
  const name = getPlayerName() || DEFAULT_PLAYER_NAME;
  const list = getLeaderboard(gameId);
  const existing = list.find((e) => e.name === name);
  if (existing) {
    if (score > existing.score) {
      existing.score = score;
      existing.date = new Date().toISOString();
    }
  } else {
    list.push({ name, score, date: new Date().toISOString() });
  }
  list.sort((a, b) => b.score - a.score);
  try {
    localStorage.setItem(LB_PREFIX + gameId, JSON.stringify(list.slice(0, MAX_ENTRIES)));
  } catch {
    /* ignore */
  }
  emit();
}

/** 返回所有“有排行数据”的游戏 id */
export function getLeaderboardGames(): string[] {
  const ids: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LB_PREFIX)) {
        const id = key.slice(LB_PREFIX.length);
        if (getLeaderboard(id).length > 0) ids.push(id);
      }
    }
  } catch {
    /* ignore */
  }
  return ids;
}

/** 总榜：各玩家所有游戏最高分之和 */
export function getGlobalLeaderboard(): GlobalRankItem[] {
  const map = new Map<string, GlobalRankItem>();
  for (const gameId of getLeaderboardGames()) {
    for (const entry of getLeaderboard(gameId)) {
      const item = map.get(entry.name) || {
        name: entry.name,
        totalScore: 0,
        gamesPlayed: 0,
        bestScore: 0,
      };
      item.totalScore += entry.score;
      item.gamesPlayed += 1;
      item.bestScore = Math.max(item.bestScore, entry.score);
      map.set(entry.name, item);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalScore - a.totalScore);
}

/** 导出全部排行数据（JSON 字符串），用于“输出数据” */
export function exportLeaderboardData(): string {
  const data: Record<string, { gameId: string; entries: LeaderboardEntry[] }> = {};
  for (const gameId of getLeaderboardGames()) {
    data[gameId] = { gameId, entries: getLeaderboard(gameId) };
  }
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      global: getGlobalLeaderboard(),
      games: data,
    },
    null,
    2
  );
}

/** 清空某个游戏的排行（不传则清空全部） */
export function clearLeaderboard(gameId?: string): void {
  try {
    if (gameId) {
      localStorage.removeItem(LB_PREFIX + gameId);
    } else {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(LB_PREFIX)) keys.push(key);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    }
  } catch {
    /* ignore */
  }
  emit();
}

/** 订阅数据变更（含跨标签页 storage 事件） */
export function useLeaderboardVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(EVT, bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener(EVT, bump);
      window.removeEventListener('storage', bump);
    };
  }, []);
  return version;
}

export function usePlayerName(): [string, (name: string) => void] {
  const [name, setName] = useState<string>(getPlayerName);
  const version = useLeaderboardVersion();
  useEffect(() => {
    setName(getPlayerName());
  }, [version]);
  return [name, setPlayerName];
}

export function useGameLeaderboard(gameId: string): LeaderboardEntry[] {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => getLeaderboard(gameId));
  const version = useLeaderboardVersion();
  useEffect(() => {
    setEntries(getLeaderboard(gameId));
  }, [gameId, version]);
  return entries;
}
