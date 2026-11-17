export const SAVE_PREFIX = 'moyu_save_';

const IGNORED_KEYS = new Set([
  'theme',
  'moyu_gamepad_enabled',
]);

export interface SaveArchive {
  format: 'moyu-save';
  version: 1;
  exportedAt: string;
  type: 'single' | 'all';
  gameId?: string;
  data: Record<string, string>;
}

function readKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) keys.push(key);
  }
  return keys;
}

export function collectGameSave(gameId: string): Record<string, string> {
  const needle = gameId.toLowerCase();
  const data: Record<string, string> = {};
  for (const key of readKeys()) {
    if (IGNORED_KEYS.has(key)) continue;
    const lower = key.toLowerCase();
    const matches =
      lower.startsWith(`moyu_save_${needle}`) ||
      lower.startsWith(`game_highscore_${needle}`) ||
      lower.startsWith(`game_score_${needle}`) ||
      lower.includes(needle);
    if (!matches) continue;
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  }
  return data;
}

export function collectAllSaves(): Record<string, string> {
  const data: Record<string, string> = {};
  for (const key of readKeys()) {
    if (IGNORED_KEYS.has(key)) continue;
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  }
  return data;
}

function dateStamp() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportGameSave(gameId: string) {
  const archive: SaveArchive = {
    format: 'moyu-save',
    version: 1,
    exportedAt: new Date().toISOString(),
    type: 'single',
    gameId,
    data: collectGameSave(gameId),
  };
  downloadJson(`moyu-save-${gameId}-${dateStamp()}.json`, archive);
  return Object.keys(archive.data).length;
}

export function exportAllSaves() {
  const archive: SaveArchive = {
    format: 'moyu-save',
    version: 1,
    exportedAt: new Date().toISOString(),
    type: 'all',
    data: collectAllSaves(),
  };
  downloadJson(`moyu-saves-all-${dateStamp()}.json`, archive);
  return Object.keys(archive.data).length;
}

export async function importSaveArchive(
  file: File,
  expectedGameId?: string,
): Promise<{ type: 'single' | 'all'; count: number }> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('文件不是有效的 JSON');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('存档格式不正确');
  }
  const archive = parsed as Partial<SaveArchive>;
  if (archive.format !== 'moyu-save' || !archive.data || typeof archive.data !== 'object') {
    throw new Error('不是摸鱼小游戏存档文件');
  }
  if (archive.version !== 1) {
    throw new Error(`不支持的存档版本：${String(archive.version)}`);
  }
  if (expectedGameId && archive.type === 'single' && archive.gameId && archive.gameId !== expectedGameId) {
    throw new Error(`该存档属于「${archive.gameId}」，与当前游戏不匹配`);
  }

  let count = 0;
  for (const [key, raw] of Object.entries(archive.data)) {
    if (IGNORED_KEYS.has(key)) continue;
    const value = typeof raw === 'string' ? raw : JSON.stringify(raw);
    localStorage.setItem(key, value);
    count++;
  }
  return { type: archive.type === 'single' ? 'single' : 'all', count };
}

export function recordGameSave(
  gameId: string,
  patch: { highScore?: number; lastScore?: number },
) {
  const key = `${SAVE_PREFIX}${gameId}`;
  let previous: Record<string, unknown> = {};
  try {
    const raw = localStorage.getItem(key);
    if (raw) previous = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    previous = {};
  }
  const next = {
    ...previous,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // localStorage 不可用时静默失败，不影响游戏
  }
}
