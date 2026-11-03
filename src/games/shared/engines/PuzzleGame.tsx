import React, { useCallback, useEffect, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import type { EngineProps, GameStatus } from '../types';

const SIZE = 4;

function solvedBoard(): number[] {
  return Array.from({ length: SIZE * SIZE }, (_, i) => (i === SIZE * SIZE - 1 ? 0 : i + 1));
}

function shuffleBoard(): number[] {
  const board = solvedBoard();
  let blank = board.length - 1;
  for (let i = 0; i < 300; i++) {
    const r = Math.floor(blank / SIZE);
    const c = blank % SIZE;
    const options: number[] = [];
    if (r > 0) options.push(blank - SIZE);
    if (r < SIZE - 1) options.push(blank + SIZE);
    if (c > 0) options.push(blank - 1);
    if (c < SIZE - 1) options.push(blank + 1);
    const pick = options[Math.floor(Math.random() * options.length)];
    [board[blank], board[pick]] = [board[pick], board[blank]];
    blank = pick;
  }
  return board;
}

function isSolved(board: number[]): boolean {
  return board.every((v, i) => (i === board.length - 1 ? v === 0 : v === i + 1));
}

export default function PuzzleGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [board, setBoard] = useState<number[]>(solvedBoard());
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [score, setScore] = useState(0);

  const start = useCallback(() => {
    setBoard(shuffleBoard());
    setMoves(0);
    setTime(0);
    setScore(0);
    setStatus('playing');
    report(0);
  }, [report]);

  useEffect(() => {
    if (status !== 'playing') return;
    const timer = window.setInterval(() => setTime(t => t + 1), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  const move = (index: number) => {
    if (status !== 'playing') return;
    const blank = board.indexOf(0);
    const br = Math.floor(blank / SIZE);
    const bc = blank % SIZE;
    const r = Math.floor(index / SIZE);
    const c = index % SIZE;
    if (Math.abs(br - r) + Math.abs(bc - c) !== 1) return;

    const next = [...board];
    [next[blank], next[index]] = [next[index], next[blank]];
    const nextMoves = moves + 1;
    setBoard(next);
    setMoves(nextMoves);
    const nextScore = Math.max(100, 3000 - nextMoves * 10 - time * 6);
    setScore(nextScore);
    report(nextScore);
    if (isSolved(next)) {
      const finalScore = Math.max(200, 3000 - nextMoves * 10 - time * 6) + 500;
      setScore(finalScore);
      setStatus('won');
      finish(finalScore);
    }
  };

  return (
    <GameFrame
      meta={meta}
      score={score}
      best={best}
      status={status}
      stats={[{ label: '步数', value: moves }, { label: '用时', value: `${time}s` }]}
      resultText={`用 ${moves} 步复原`}
      hint="点击空格旁边的数字方块滑动；把 1~15 按顺序排好即可通关"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          经典数字华容道。<br />滑动数字，让 1~15 按顺序排列，右下角留空。
        </StartPanel>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${SIZE}, 1fr)`,
            gap: 6,
            padding: 10,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${meta.primary}33`,
            width: 'min(92vw, 400px)',
            aspectRatio: '1 / 1',
            margin: '0 auto',
          }}
        >
          {board.map((value, index) => (
            <button
              key={index}
              onClick={() => move(index)}
              disabled={value === 0}
              style={{
                borderRadius: 10,
                border: value === 0 ? '1px dashed rgba(255,255,255,0.08)' : `1px solid ${meta.primary}44`,
                background:
                  value === 0
                    ? 'transparent'
                    : isSolved(board) || value === index + 1
                      ? 'rgba(34,197,94,0.2)'
                      : `linear-gradient(145deg, ${meta.primary}44, ${meta.secondary}33)`,
                color: '#fff',
                fontSize: 'clamp(18px, 4vw, 28px)',
                fontWeight: 800,
                cursor: value === 0 ? 'default' : 'pointer',
                transition: 'all .12s',
              }}
            >
              {value === 0 ? '' : value}
            </button>
          ))}
        </div>
      )}
    </GameFrame>
  );
}
