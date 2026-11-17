export type Stone = 0 | 1 | 2;
export type Player = 1 | 2;
export type BoardSize = 9 | 13 | 19;
export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface Point {
  x: number;
  y: number;
}

export interface MoveResult {
  ok: boolean;
  reason?: string;
  captured?: number;
}

export interface ScoreResult {
  black: number;
  white: number;
  komi: number;
  winner: Player | 0;
  margin: number;
}

export interface GoState {
  size: BoardSize;
  board: Int8Array;
  turn: Player;
  captures: { black: number; white: number };
  lastMove: number | null;
  passes: number;
  moveNumber: number;
  gameOver: boolean;
  koPoint: number;
  winner: Player | 0;
  reason: string;
}

interface Snapshot {
  board: Int8Array;
  turn: Player;
  captures: { black: number; white: number };
  lastMove: number | null;
  passes: number;
  moveNumber: number;
  gameOver: boolean;
  koPoint: number;
  winner: Player | 0;
  reason: string;
}

export const KOMI: Record<BoardSize, number> = {
  9: 5.5,
  13: 6.5,
  19: 7.5,
};

const adjacencyCache = new Map<number, number[][]>();

function buildAdjacency(size: number): number[][] {
  const cached = adjacencyCache.get(size);
  if (cached) return cached;
  const adj: number[][] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const list: number[] = [];
      if (x > 0) list.push(y * size + (x - 1));
      if (x < size - 1) list.push(y * size + (x + 1));
      if (y > 0) list.push((y - 1) * size + x);
      if (y < size - 1) list.push((y + 1) * size + x);
      adj[y * size + x] = list;
    }
  }
  adjacencyCache.set(size, adj);
  return adj;
}

export function starPoints(size: BoardSize): Point[] {
  const lines = size === 9 ? [2, 4, 6] : size === 13 ? [3, 6, 9] : [3, 9, 15];
  const points: Point[] = [];
  for (const y of lines) {
    for (const x of lines) {
      points.push({ x, y });
    }
  }
  return points;
}

function groupInfo(board: Int8Array, adj: number[][], start: number) {
  const color = board[start];
  const stones: number[] = [];
  const liberties = new Set<number>();
  if (color === 0) return { stones, liberties };
  const seen = new Set<number>([start]);
  const stack = [start];
  while (stack.length) {
    const idx = stack.pop() as number;
    stones.push(idx);
    for (const n of adj[idx]) {
      if (board[n] === 0) liberties.add(n);
      else if (board[n] === color && !seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return { stones, liberties };
}

interface ResolvedMove {
  ok: boolean;
  board?: Int8Array;
  captured: number;
  capturedPoints: number[];
  ownStones: number;
  ownLiberties: number;
}

function resolveMove(
  board: Int8Array,
  adj: number[][],
  idx: number,
  player: Player,
): ResolvedMove {
  const next = board.slice();
  next[idx] = player;
  const opponent: Player = player === 1 ? 2 : 1;
  const capturedPoints: number[] = [];
  const visited = new Set<number>();

  for (const n of adj[idx]) {
    if (next[n] !== opponent || visited.has(n)) continue;
    const group = groupInfo(next, adj, n);
    group.stones.forEach(s => visited.add(s));
    if (group.liberties.size === 0) {
      for (const s of group.stones) {
        next[s] = 0;
        capturedPoints.push(s);
      }
    }
  }

  const own = groupInfo(next, adj, idx);
  if (own.liberties.size === 0) {
    return {
      ok: false,
      captured: capturedPoints.length,
      capturedPoints,
      ownStones: 0,
      ownLiberties: 0,
    };
  }

  return {
    ok: true,
    board: next,
    captured: capturedPoints.length,
    capturedPoints,
    ownStones: own.stones.length,
    ownLiberties: own.liberties.size,
  };
}

function isEyeLike(board: Int8Array, adj: number[][], idx: number, player: Player, size: number) {
  for (const n of adj[idx]) {
    if (board[n] !== player) return false;
  }
  const x = idx % size;
  const y = Math.floor(idx / size);
  for (let dy = -1; dy <= 1; dy += 2) {
    for (let dx = -1; dx <= 1; dx += 2) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      if (board[ny * size + nx] !== player) return false;
    }
  }
  return true;
}

function countTerritory(board: Int8Array, adj: number[][], size: number) {
  const visited = new Uint8Array(board.length);
  let black = 0;
  let white = 0;
  for (let i = 0; i < board.length; i++) {
    if (board[i] === 1) black++;
    else if (board[i] === 2) white++;
    if (board[i] !== 0 || visited[i]) continue;
    const region: number[] = [];
    const borders = new Set<number>();
    const stack = [i];
    visited[i] = 1;
    while (stack.length) {
      const idx = stack.pop() as number;
      region.push(idx);
      for (const n of adj[idx]) {
        if (board[n] === 0) {
          if (!visited[n]) {
            visited[n] = 1;
            stack.push(n);
          }
        } else {
          borders.add(board[n]);
        }
      }
    }
    if (borders.size === 1) {
      if (borders.has(1)) black += region.length;
      else white += region.length;
    }
  }
  return { black, white };
}

export class GoEngine {
  size: BoardSize;
  board: Int8Array;
  turn: Player;
  captures: { black: number; white: number };
  lastMove: number | null;
  passes: number;
  moveNumber: number;
  gameOver: boolean;
  koPoint: number;
  winner: Player | 0;
  reason: string;
  private adj: number[][];
  private history: Snapshot[] = [];

  constructor(size: BoardSize = 9) {
    this.size = size;
    this.adj = buildAdjacency(size);
    this.board = new Int8Array(size * size);
    this.turn = 1;
    this.captures = { black: 0, white: 0 };
    this.lastMove = null;
    this.passes = 0;
    this.moveNumber = 0;
    this.gameOver = false;
    this.koPoint = -1;
    this.winner = 0;
    this.reason = '';
  }

  reset(size: BoardSize = this.size) {
    this.size = size;
    this.adj = buildAdjacency(size);
    this.board = new Int8Array(size * size);
    this.turn = 1;
    this.captures = { black: 0, white: 0 };
    this.lastMove = null;
    this.passes = 0;
    this.moveNumber = 0;
    this.gameOver = false;
    this.koPoint = -1;
    this.winner = 0;
    this.reason = '';
    this.history = [];
  }

  getState(): GoState {
    return {
      size: this.size,
      board: this.board,
      turn: this.turn,
      captures: { ...this.captures },
      lastMove: this.lastMove,
      passes: this.passes,
      moveNumber: this.moveNumber,
      gameOver: this.gameOver,
      koPoint: this.koPoint,
      winner: this.winner,
      reason: this.reason,
    };
  }

  at(x: number, y: number): Stone {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return 0;
    return this.board[y * this.size + x] as Stone;
  }

  isLegal(x: number, y: number): boolean {
    if (this.gameOver) return false;
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return false;
    const idx = y * this.size + x;
    if (this.board[idx] !== 0 || idx === this.koPoint) return false;
    return resolveMove(this.board, this.adj, idx, this.turn).ok;
  }

  private snapshot(): Snapshot {
    return {
      board: this.board.slice(),
      turn: this.turn,
      captures: { ...this.captures },
      lastMove: this.lastMove,
      passes: this.passes,
      moveNumber: this.moveNumber,
      gameOver: this.gameOver,
      koPoint: this.koPoint,
      winner: this.winner,
      reason: this.reason,
    };
  }

  play(x: number, y: number): MoveResult {
    if (this.gameOver) return { ok: false, reason: '对局已结束' };
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) {
      return { ok: false, reason: '落子超出棋盘' };
    }
    const idx = y * this.size + x;
    if (this.board[idx] !== 0) return { ok: false, reason: '该位置已有棋子' };
    if (idx === this.koPoint) return { ok: false, reason: '劫争：不可立即回提' };

    const resolved = resolveMove(this.board, this.adj, idx, this.turn);
    if (!resolved.ok || !resolved.board) {
      return { ok: false, reason: '禁入点：不可自杀' };
    }

    this.history.push(this.snapshot());
    this.board = resolved.board;
    if (this.turn === 1) this.captures.black += resolved.captured;
    else this.captures.white += resolved.captured;

    const createsKo =
      resolved.captured === 1 && resolved.ownStones === 1 && resolved.ownLiberties === 1;
    this.koPoint = createsKo ? resolved.capturedPoints[0] : -1;
    this.turn = this.turn === 1 ? 2 : 1;
    this.lastMove = idx;
    this.passes = 0;
    this.moveNumber++;

    return { ok: true, captured: resolved.captured };
  }

  pass(): { ok: boolean; gameOver: boolean } {
    if (this.gameOver) return { ok: false, gameOver: true };
    this.history.push(this.snapshot());
    this.passes++;
    this.koPoint = -1;
    this.lastMove = null;
    this.turn = this.turn === 1 ? 2 : 1;
    this.moveNumber++;
    if (this.passes >= 2) {
      this.finishByScore();
      return { ok: true, gameOver: true };
    }
    return { ok: true, gameOver: false };
  }

  resign() {
    if (this.gameOver) return;
    this.history.push(this.snapshot());
    this.gameOver = true;
    this.winner = this.turn === 1 ? 2 : 1;
    this.reason = `${this.winner === 1 ? '黑方' : '白方'}中盘胜（对方认输）`;
  }

  finish() {
    if (this.gameOver) return;
    this.history.push(this.snapshot());
    this.finishByScore();
  }

  undo(steps = 1): boolean {
    if (!this.history.length) return false;
    let restored = false;
    for (let i = 0; i < steps && this.history.length; i++) {
      const snap = this.history.pop() as Snapshot;
      this.board = snap.board;
      this.turn = snap.turn;
      this.captures = snap.captures;
      this.lastMove = snap.lastMove;
      this.passes = snap.passes;
      this.moveNumber = snap.moveNumber;
      this.gameOver = snap.gameOver;
      this.koPoint = snap.koPoint;
      this.winner = snap.winner;
      this.reason = snap.reason;
      restored = true;
    }
    return restored;
  }

  score(): ScoreResult {
    const { black, white } = countTerritory(this.board, this.adj, this.size);
    const komi = KOMI[this.size];
    const whiteTotal = white + komi;
    const diff = black - whiteTotal;
    return {
      black,
      white: whiteTotal,
      komi,
      winner: diff > 0 ? 1 : diff < 0 ? 2 : 0,
      margin: Math.abs(diff),
    };
  }

  private finishByScore() {
    const result = this.score();
    this.gameOver = true;
    this.winner = result.winner;
    this.reason =
      result.winner === 0
        ? `和棋（黑 ${result.black} : 白 ${result.white}）`
        : `${result.winner === 1 ? '黑方' : '白方'}胜 ${result.margin} 子（黑 ${result.black} : 白 ${result.white}）`;
  }
}

interface Candidate {
  idx: number;
  score: number;
}

function proximityScore(board: Int8Array, size: number, idx: number) {
  const x = idx % size;
  const y = Math.floor(idx / size);
  let score = 0;
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      if (board[ny * size + nx] !== 0) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        score += dist === 1 ? 3 : 1;
      }
    }
  }
  return score;
}

function evaluateMove(
  board: Int8Array,
  adj: number[][],
  size: number,
  idx: number,
  player: Player,
  occupied: number,
): Candidate | null {
  if (board[idx] !== 0) return null;
  const resolved = resolveMove(board, adj, idx, player);
  if (!resolved.ok || !resolved.board) return null;

  const opponent: Player = player === 1 ? 2 : 1;
  const next = resolved.board;
  let atari = 0;
  const seen = new Set<number>();
  for (const n of adj[idx]) {
    if (next[n] !== opponent || seen.has(n)) continue;
    const group = groupInfo(next, adj, n);
    group.stones.forEach(s => seen.add(s));
    if (group.liberties.size === 1) atari++;
  }

  let saved = 0;
  const beforeSeen = new Set<number>();
  for (const n of adj[idx]) {
    if (board[n] !== player || beforeSeen.has(n)) continue;
    const group = groupInfo(board, adj, n);
    group.stones.forEach(s => beforeSeen.add(s));
    if (group.liberties.size === 1) saved++;
  }

  const x = idx % size;
  const y = Math.floor(idx / size);
  const edge = x === 0 || y === 0 || x === size - 1 || y === size - 1;
  const line2 = x === 1 || y === 1 || x === size - 2 || y === size - 2;
  const center = Math.abs(x - (size - 1) / 2) + Math.abs(y - (size - 1) / 2);

  let score = 0;
  score += resolved.captured * 160;
  score += resolved.ownLiberties * 7;
  score += atari * 36;
  score += saved * 70;
  score += proximityScore(board, size, idx) * 2;
  score += Math.max(0, size - center) * 0.8;

  if (resolved.ownLiberties === 1 && resolved.captured === 0) score -= 220;
  if (isEyeLike(board, adj, idx, player, size)) score -= 300;
  if (edge && occupied < size * 2) score -= 14;
  else if (line2 && occupied < size) score -= 4;
  if (resolved.captured > 0) score += 40;

  return { idx, score };
}

function pickWeighted(candidates: Candidate[], pool: number): Candidate {
  const sorted = [...candidates].sort((a, b) => b.score - a.score).slice(0, pool);
  const best = sorted[0];
  const spread = Math.max(20, Math.abs(best.score) * 0.15 + 10);
  const weights = sorted.map(c => Math.exp((c.score - best.score) / spread));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < sorted.length; i++) {
    r -= weights[i];
    if (r <= 0) return sorted[i];
  }
  return best;
}

export function chooseAIMove(
  size: BoardSize,
  board: Int8Array,
  player: Player,
  koPoint: number,
  difficulty: AIDifficulty,
): Point | null {
  const adj = buildAdjacency(size);
  let occupied = 0;
  for (let i = 0; i < board.length; i++) if (board[i] !== 0) occupied++;

  let candidates: Candidate[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== 0 || i === koPoint) continue;
    if (occupied > 0 && proximityScore(board, size, i) === 0) continue;
    const evaluated = evaluateMove(board, adj, size, i, player, occupied);
    if (evaluated) candidates.push(evaluated);
  }

  // 开局或附近没有任何落点时，优先占据星位与中心
  if (candidates.length === 0) {
    const preferred = starPoints(size)
      .map(p => p.y * size + p.x)
      .filter(i => board[i] === 0 && i !== koPoint);
    if (preferred.length === 0) return null;
    const idx = preferred[Math.floor(Math.random() * preferred.length)];
    return { x: idx % size, y: Math.floor(idx / size) };
  }

  if (difficulty === 'hard') {
    const top = [...candidates].sort((a, b) => b.score - a.score).slice(0, 14);
    for (const candidate of top) {
      const resolved = resolveMove(board, adj, candidate.idx, player);
      if (!resolved.ok || !resolved.board) continue;
      const opponent: Player = player === 1 ? 2 : 1;
      let reply = 0;
      for (let i = 0; i < resolved.board.length; i++) {
        if (resolved.board[i] !== 0) continue;
        if (proximityScore(resolved.board, size, i) === 0) continue;
        const response = evaluateMove(resolved.board, adj, size, i, opponent, occupied + 1);
        if (response && response.score > reply) reply = response.score;
      }
      candidate.score -= reply * 0.32;
    }
    const best = top.sort((a, b) => b.score - a.score)[0];
    return { x: best.idx % size, y: Math.floor(best.idx / size) };
  }

  if (difficulty === 'easy') {
    const chosen = pickWeighted(candidates, 12);
    return { x: chosen.idx % size, y: Math.floor(chosen.idx / size) };
  }

  const chosen = pickWeighted(candidates, 4);
  return { x: chosen.idx % size, y: Math.floor(chosen.idx / size) };
}
