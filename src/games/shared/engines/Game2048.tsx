import React, { useCallback, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import { useKeyboard } from '../../../hooks/useKeyboard';
import type { EngineProps, GameStatus } from '../types';

const SIZE = 4;

type Board = number[][];

const TILE_COLORS: Record<number, string> = {
  0: 'rgba(255,255,255,0.04)',
  2: '#eee4da',
  4: '#ede0c8',
  8: '#f2b179',
  16: '#f59563',
  32: '#f67c5f',
  64: '#f65e3b',
  128: '#edcf72',
  256: '#edcc61',
  512: '#edc850',
  1024: '#edc53f',
  2048: '#edc22e',
};

function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function addRandom(board: Board): Board {
  const next = board.map(row => [...row]);
  const empties: [number, number][] = [];
  next.forEach((row, r) => row.forEach((v, c) => { if (v === 0) empties.push([r, c]); }));
  if (empties.length === 0) return next;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function freshBoard(): Board {
  return addRandom(addRandom(emptyBoard()));
}

function slideLine(line: number[]): { line: number[]; gained: number; moved: boolean } {
  const values = line.filter(v => v !== 0);
  const merged: number[] = [];
  let gained = 0;
  for (let i = 0; i < values.length; i++) {
    if (i + 1 < values.length && values[i] === values[i + 1]) {
      const value = values[i] * 2;
      merged.push(value);
      gained += value;
      i++;
    } else {
      merged.push(values[i]);
    }
  }
  while (merged.length < SIZE) merged.push(0);
  return {
    line: merged,
    gained,
    moved: merged.some((v, i) => v !== line[i]),
  };
}

function move(board: Board, dir: 'left' | 'right' | 'up' | 'down'): { board: Board; gained: number; moved: boolean } {
  let next = board.map(row => [...row]);
  let gained = 0;
  let moved = false;

  if (dir === 'left' || dir === 'right') {
    next = next.map(row => {
      const source = dir === 'left' ? row : [...row].reverse();
      const result = slideLine(source);
      gained += result.gained;
      moved = moved || result.moved;
      return dir === 'left' ? result.line : result.line.reverse();
    });
  } else {
    for (let c = 0; c < SIZE; c++) {
      const column = next.map(row => row[c]);
      const source = dir === 'up' ? column : [...column].reverse();
      const result = slideLine(source);
      gained += result.gained;
      moved = moved || result.moved;
      const finalLine = dir === 'up' ? result.line : result.line.reverse();
      for (let r = 0; r < SIZE; r++) next[r][c] = finalLine[r];
    }
  }

  return { board: next, gained, moved };
}

function canMove(board: Board): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return true;
      if (c + 1 < SIZE && board[r][c] === board[r][c + 1]) return true;
      if (r + 1 < SIZE && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

export default function Game2048({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [board, setBoard] = useState<Board>(() => freshBoard());
  const [score, setScore] = useState(0);

  const start = useCallback(() => {
    setBoard(freshBoard());
    setScore(0);
    setStatus('playing');
    report(0);
  }, [report]);

  const doMove = useCallback((dir: 'left' | 'right' | 'up' | 'down') => {
    if (status !== 'playing') return;
    const result = move(board, dir);
    if (!result.moved) return;
    const nextBoard = addRandom(result.board);
    const nextScore = score + result.gained;
    setBoard(nextBoard);
    setScore(nextScore);
    report(nextScore);

    if (nextBoard.some(row => row.some(v => v >= 2048))) {
      setStatus('won');
      finish(nextScore);
      return;
    }
    if (!canMove(nextBoard)) {
      setStatus('lost');
      finish(nextScore);
    }
  }, [status, board, score, report, finish]);

  useKeyboard({
    onArrowLeft: () => doMove('left'),
    onArrowRight: () => doMove('right'),
    onArrowUp: () => doMove('up'),
    onArrowDown: () => doMove('down'),
    onA: () => doMove('left'),
    onD: () => doMove('right'),
    onW: () => doMove('up'),
    onS: () => doMove('down'),
    enabled: status === 'playing',
  });

  return (
    <GameFrame
      meta={meta}
      score={score}
      best={best}
      status={status}
      stats={[{ label: '最大方块', value: Math.max(...board.flat()) }]}
      resultText={`合并出 ${Math.max(...board.flat())}`}
      hint="方向键 / WASD 或下方按钮移动方块；相同数字碰撞会合并，凑出 2048 即通关"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          经典 2048。<br />滑动方块，让相同数字合并，目标是凑出 2048。
        </StartPanel>
      ) : (
        <div style={{ width: '100%', maxWidth: 440, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${SIZE}, 1fr)`,
              gap: 10,
              padding: 10,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${meta.primary}33`,
            }}
          >
            {board.map((row, r) =>
              row.map((value, c) => (
                <div
                  key={`${r}-${c}`}
                  style={{
                    aspectRatio: '1 / 1',
                    borderRadius: 10,
                    background: TILE_COLORS[value] || '#edc22e',
                    color: value >= 8 ? '#fff' : '#3b2f22',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: value >= 1000 ? 'clamp(16px, 4vw, 24px)' : 'clamp(20px, 5vw, 30px)',
                    fontWeight: 800,
                    boxShadow: value > 0 ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                    transition: 'background .15s',
                  }}
                >
                  {value || ''}
                </div>
              ))
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 54px)', gap: 6, justifyContent: 'center', marginTop: 14 }}>
            <span />
            <button onClick={() => doMove('up')} style={pad(meta)}>↑</button>
            <span />
            <button onClick={() => doMove('left')} style={pad(meta)}>←</button>
            <button onClick={() => doMove('down')} style={pad(meta)}>↓</button>
            <button onClick={() => doMove('right')} style={pad(meta)}>→</button>
          </div>
        </div>
      )}
    </GameFrame>
  );
}

function pad(meta: EngineProps['meta']): React.CSSProperties {
  return {
    width: 54,
    height: 48,
    borderRadius: 10,
    border: `1px solid ${meta.primary}55`,
    background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    fontSize: 18,
    cursor: 'pointer',
  };
}
