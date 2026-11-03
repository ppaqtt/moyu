import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import type { EngineProps, GameStatus } from '../types';

const N = 15;
const HUMAN = 1;
const AI = 2;
const DIRS: [number, number][] = [[1, 0], [0, 1], [1, 1], [1, -1]];

function emptyBoard(): number[][] {
  return Array.from({ length: N }, () => Array(N).fill(0));
}

function countLine(board: number[][], r: number, c: number, dr: number, dc: number, player: number) {
  let count = 1;
  let open = 0;
  let rr = r + dr;
  let cc = c + dc;
  while (rr >= 0 && rr < N && cc >= 0 && cc < N && board[rr][cc] === player) {
    count++;
    rr += dr;
    cc += dc;
  }
  if (rr >= 0 && rr < N && cc >= 0 && cc < N && board[rr][cc] === 0) open++;
  rr = r - dr;
  cc = c - dc;
  while (rr >= 0 && rr < N && cc >= 0 && cc < N && board[rr][cc] === player) {
    count++;
    rr -= dr;
    cc -= dc;
  }
  if (rr >= 0 && rr < N && cc >= 0 && cc < N && board[rr][cc] === 0) open++;
  return { count, open };
}

function patternScore(count: number, open: number): number {
  if (count >= 5) return 10_000_000;
  if (count === 4) return open >= 2 ? 1_000_000 : open === 1 ? 100_000 : 0;
  if (count === 3) return open >= 2 ? 20_000 : open === 1 ? 2_000 : 0;
  if (count === 2) return open >= 2 ? 800 : open === 1 ? 120 : 0;
  return open >= 2 ? 20 : 5;
}

function scorePoint(board: number[][], r: number, c: number, player: number): number {
  board[r][c] = player;
  let total = 0;
  for (const [dr, dc] of DIRS) {
    const { count, open } = countLine(board, r, c, dr, dc, player);
    total += patternScore(count, open);
  }
  board[r][c] = 0;
  return total;
}

function hasFive(board: number[][], r: number, c: number, player: number): boolean {
  for (const [dr, dc] of DIRS) {
    let count = 1;
    for (const sign of [1, -1]) {
      let rr = r + dr * sign;
      let cc = c + dc * sign;
      while (rr >= 0 && rr < N && cc >= 0 && cc < N && board[rr][cc] === player) {
        count++;
        rr += dr * sign;
        cc += dc * sign;
      }
    }
    if (count >= 5) return true;
  }
  return false;
}

function aiMove(board: number[][]): [number, number] {
  let hasStone = false;
  const candidates: [number, number][] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (board[r][c] !== 0) {
        hasStone = true;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const rr = r + dr;
            const cc = c + dc;
            if (rr >= 0 && rr < N && cc >= 0 && cc < N && board[rr][cc] === 0) candidates.push([rr, cc]);
          }
        }
      }
    }
  }
  if (!hasStone) return [Math.floor(N / 2), Math.floor(N / 2)];
  let best: [number, number] = candidates[0] || [Math.floor(N / 2), Math.floor(N / 2)];
  let bestScore = -1;
  const seen = new Set<string>();
  for (const [r, c] of candidates) {
    const key = `${r},${c}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const attack = scorePoint(board, r, c, AI);
    const defend = scorePoint(board, r, c, HUMAN);
    const value = attack * 1.15 + defend + Math.random() * 8;
    if (value > bestScore) {
      bestScore = value;
      best = [r, c];
    }
  }
  return best;
}

export default function BoardGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [board, setBoard] = useState<number[][]>(emptyBoard);
  const [score, setScore] = useState(0);
  const [turn, setTurn] = useState<'human' | 'ai'>('human');
  const [last, setLast] = useState<[number, number] | null>(null);
  const [thinking, setThinking] = useState(false);
  const aiTimer = useRef<number | null>(null);

  const start = useCallback(() => {
    if (aiTimer.current) window.clearTimeout(aiTimer.current);
    setBoard(emptyBoard());
    setScore(0);
    setTurn('human');
    setLast(null);
    setThinking(false);
    setStatus('playing');
    report(0);
  }, [report]);

  useEffect(() => () => {
    if (aiTimer.current) window.clearTimeout(aiTimer.current);
  }, []);

  const play = (r: number, c: number) => {
    if (status !== 'playing' || turn !== 'human' || thinking || board[r][c] !== 0) return;

    const next = board.map(row => [...row]);
    next[r][c] = HUMAN;
    const nextScore = score + 10;
    setBoard(next);
    setScore(nextScore);
    setLast([r, c]);
    report(nextScore);

    if (hasFive(next, r, c, HUMAN)) {
      setStatus('won');
      finish(nextScore + 1000);
      return;
    }

    setTurn('ai');
    setThinking(true);
    aiTimer.current = window.setTimeout(() => {
      const [ar, ac] = aiMove(next);
      const after = next.map(row => [...row]);
      after[ar][ac] = AI;
      setBoard(after);
      setLast([ar, ac]);
      setThinking(false);
      if (hasFive(after, ar, ac, AI)) {
        setTurn('human');
        setStatus('lost');
        finish(nextScore);
      } else {
        setTurn('human');
      }
    }, 320);
  };

  return (
    <GameFrame
      meta={meta}
      score={score}
      best={best}
      status={status}
      stats={[{ label: '你', value: '⚫ 黑子' }, { label: '对手', value: '⚪ AI' }, { label: '回合', value: thinking ? 'AI 思考中…' : '你的回合' }]}
      resultText={status === 'won' ? '你连成五子，获胜！' : 'AI 连成五子'}
      hint="你执黑先行。点击棋盘落子，先连成横向、纵向或斜向五子者获胜"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          经典五子棋，你执黑先行。<br />AI 会进攻也会防守，先连成五子获胜。
        </StartPanel>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${N}, 1fr)`,
            width: 'min(94vw, 540px)',
            aspectRatio: '1 / 1',
            padding: 8,
            background: 'linear-gradient(145deg, #d9a45b, #b97c31)',
            border: '2px solid #8b5a1e',
            borderRadius: 8,
            margin: '0 auto',
            gap: 0,
          }}
        >
          {board.map((row, r) =>
            row.map((value, c) => {
              const isLast = last?.[0] === r && last?.[1] === c;
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => play(r, c)}
                  style={{
                    position: 'relative',
                    aspectRatio: '1 / 1',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: status === 'playing' && turn === 'human' ? 'pointer' : 'default',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      inset: '8%',
                      borderRadius: '50%',
                      background:
                        value === HUMAN
                          ? 'radial-gradient(circle at 35% 30%, #555, #000)'
                          : value === AI
                            ? 'radial-gradient(circle at 35% 30%, #fff, #bbb)'
                            : 'transparent',
                      boxShadow: isLast ? `0 0 10px ${meta.secondary}` : 'none',
                      border: isLast ? `1px solid ${meta.primary}` : 'none',
                    }}
                  />
                </button>
              );
            })
          )}
        </div>
      )}
    </GameFrame>
  );
}
