import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Game2048MergeProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
  onExit?: () => void;
}

type Direction = 'up' | 'down' | 'left' | 'right';

const SIZE = 5;
const TARGET = 4096;

const TILE_STYLES: Record<number, { background: string; color: string }> = {
  2: { background: '#2d3748', color: '#e2e8f0' },
  4: { background: '#3b4a63', color: '#e2e8f0' },
  8: { background: '#0e7490', color: '#ffffff' },
  16: { background: '#0891b2', color: '#ffffff' },
  32: { background: '#7c3aed', color: '#ffffff' },
  64: { background: '#9333ea', color: '#ffffff' },
  128: { background: '#c026d3', color: '#ffffff' },
  256: { background: '#db2777', color: '#ffffff' },
  512: { background: '#e11d48', color: '#ffffff' },
  1024: { background: '#ea580c', color: '#ffffff' },
  2048: { background: '#eab308', color: '#1a1a2e' },
  4096: { background: '#22c55e', color: '#0a0a1a' },
};

function emptyBoard(): number[][] {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 0));
}

function addRandomTile(board: number[][]): number[][] {
  const next = board.map(row => [...row]);
  const empty: Array<[number, number]> = [];
  next.forEach((row, rowIndex) => row.forEach((value, colIndex) => {
    if (value === 0) empty.push([rowIndex, colIndex]);
  }));
  if (!empty.length) return next;
  const [row, col] = empty[Math.floor(Math.random() * empty.length)];
  next[row][col] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function createBoard(): number[][] {
  return addRandomTile(addRandomTile(emptyBoard()));
}

function slideLine(line: number[]): { line: number[]; gained: number } {
  const filtered = line.filter(value => value !== 0);
  const result: number[] = [];
  let gained = 0;
  for (let index = 0; index < filtered.length; index++) {
    if (filtered[index] === filtered[index + 1]) {
      const merged = filtered[index] * 2;
      result.push(merged);
      gained += merged;
      index++;
    } else {
      result.push(filtered[index]);
    }
  }
  while (result.length < SIZE) result.push(0);
  return { line: result, gained };
}

function transpose(board: number[][]): number[][] {
  return board[0].map((_, colIndex) => board.map(row => row[colIndex]));
}

function moveBoard(board: number[][], direction: Direction) {
  const vertical = direction === 'up' || direction === 'down';
  const working = vertical ? transpose(board) : board.map(row => [...row]);
  let gained = 0;

  const moved = working.map(row => {
    const reverse = direction === 'right' || direction === 'down';
    const line = reverse ? [...row].reverse() : row;
    const result = slideLine(line);
    gained += result.gained;
    return reverse ? result.line.reverse() : result.line;
  });

  const next = vertical ? transpose(moved) : moved;
  return { next, gained, moved: JSON.stringify(next) !== JSON.stringify(board) };
}

function isGameOver(board: number[][]): boolean {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (board[row][col] === 0) return false;
      if (col + 1 < SIZE && board[row][col] === board[row][col + 1]) return false;
      if (row + 1 < SIZE && board[row][col] === board[row + 1][col]) return false;
    }
  }
  return true;
}

export default function Game2048Merge({ onScoreUpdate, onGameOver, onExit }: Game2048MergeProps) {
  const [board, setBoard] = useState<number[][]>(() => createBoard());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const hasWon = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleMove = useCallback((direction: Direction) => {
    if (gameOver) return;
    const { next, gained, moved } = moveBoard(board, direction);
    if (!moved) return;

    const withTile = addRandomTile(next);
    const nextScore = score + gained;
    setBoard(withTile);
    setScore(nextScore);
    setBest(prev => Math.max(prev, nextScore));
    onScoreUpdate?.(nextScore);

    if (!hasWon.current && withTile.some(row => row.some(value => value >= TARGET))) {
      hasWon.current = true;
      setWon(true);
    }

    if (isGameOver(withTile)) {
      setGameOver(true);
      onGameOver?.(nextScore);
    }
  }, [board, score, gameOver, won, onScoreUpdate, onGameOver]);

  useEffect(() => {
    const keyMap: Record<string, Direction> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
      w: 'up',
      s: 'down',
      a: 'left',
      d: 'right',
      W: 'up',
      S: 'down',
      A: 'left',
      D: 'right',
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = keyMap[event.key];
      if (!direction) return;
      event.preventDefault();
      handleMove(direction);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  const handleRestart = () => {
    setBoard(createBoard());
    setScore(0);
    setGameOver(false);
    setWon(false);
    hasWon.current = false;
    onScoreUpdate?.(0);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) return;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      handleMove(deltaX > 0 ? 'right' : 'left');
    } else {
      handleMove(deltaY > 0 ? 'down' : 'up');
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 55%, #16213e 100%)' }}
    >
      <div className="w-full max-w-xl flex items-center justify-between py-4">
        <motion.button
          onClick={onExit}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{ background: 'rgba(26,26,46,0.8)', color: '#00d2ff', border: '1px solid rgba(0,210,255,0.3)' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回主页
        </motion.button>
        <div className="flex gap-3">
          <div className="px-4 py-2 rounded-lg text-center" style={{ background: 'rgba(26,26,46,0.8)', border: '1px solid rgba(234,179,8,0.4)' }}>
            <div className="text-xs opacity-70" style={{ color: '#eab308' }}>分数</div>
            <div className="text-lg font-bold" style={{ color: '#eab308' }}>{score}</div>
          </div>
          <div className="px-4 py-2 rounded-lg text-center" style={{ background: 'rgba(26,26,46,0.8)', border: '1px solid rgba(34,197,94,0.4)' }}>
            <div className="text-xs opacity-70" style={{ color: '#22c55e' }}>最高</div>
            <div className="text-lg font-bold" style={{ color: '#22c55e' }}>{best}</div>
          </div>
        </div>
      </div>

      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold" style={{ color: '#00d2ff' }}>2048 合并版 · 5×5</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
          方向键 / WASD 移动，相同数字合并，目标 {TARGET}
        </p>
      </div>

      <motion.div
        className="relative rounded-2xl p-3 touch-none"
        style={{
          width: 'min(92vw, 460px)',
          background: 'rgba(15,15,26,0.92)',
          border: '1px solid rgba(0,210,255,0.25)',
          boxShadow: '0 0 30px rgba(0,210,255,0.08)',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}>
          {board.map((row, rowIndex) => row.map((value, colIndex) => {
            const style = TILE_STYLES[value] ?? { background: '#16a34a', color: '#ffffff' };
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="rounded-xl flex items-center justify-center font-black select-none"
                style={{
                  aspectRatio: '1 / 1',
                  background: value ? style.background : 'rgba(255,255,255,0.05)',
                  color: style.color,
                  fontSize: value >= 1000 ? '1.15rem' : value >= 100 ? '1.45rem' : '1.7rem',
                  transition: 'background 120ms ease',
                }}
              >
                {value || ''}
              </div>
            );
          }))}
        </div>

        {(gameOver || won) && (
          <motion.div
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center"
            style={{ background: 'rgba(10,10,20,0.88)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-3xl font-bold mb-2" style={{ color: gameOver ? '#ef4444' : '#22c55e' }}>
              {gameOver ? '无法继续了' : `达成 ${TARGET}！`}
            </div>
            <div className="text-lg mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>本局得分 {score}</div>
            <div className="flex gap-3">
              <motion.button
                onClick={handleRestart}
                className="px-6 py-2.5 rounded-xl font-bold"
                style={{ background: 'linear-gradient(135deg, #22c55e, #06b6d4)', color: '#0a0a1a' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                再来一局
              </motion.button>
              {won && !gameOver && (
                <motion.button
                  onClick={() => setWon(false)}
                  className="px-6 py-2.5 rounded-xl font-bold"
                  style={{ background: 'rgba(26,26,46,0.95)', color: '#00d2ff', border: '1px solid rgba(0,210,255,0.4)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  继续挑战
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      <div className="flex items-center gap-4 mt-6">
        <motion.button
          onClick={handleRestart}
          className="px-6 py-2.5 rounded-xl font-bold"
          style={{ background: 'rgba(26,26,46,0.9)', color: '#00d2ff', border: '1px solid rgba(0,210,255,0.4)' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          重新开始
        </motion.button>
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>手机端支持滑动</span>
      </div>
    </div>
  );
}
