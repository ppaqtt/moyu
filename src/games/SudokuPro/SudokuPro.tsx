import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SudokuProProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
  onExit?: () => void;
}

const SIDE = 9;
const BOX = 3;
const DIFFICULTIES = [
  { name: '简单', clues: 40, baseScore: 600 },
  { name: '中等', clues: 32, baseScore: 900 },
  { name: '困难', clues: 26, baseScore: 1400 },
];

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function pattern(row: number, col: number) {
  return (BOX * (row % BOX) + Math.floor(row / BOX) + col) % SIDE;
}

function generateSolution(): number[][] {
  const rows = shuffled([0, 1, 2]).flatMap(band => shuffled([0, 1, 2]).map(row => band * BOX + row));
  const cols = shuffled([0, 1, 2]).flatMap(stack => shuffled([0, 1, 2]).map(col => stack * BOX + col));
  const digits = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  return rows.map(row => cols.map(col => digits[pattern(row, col)]));
}

function makePuzzle(difficulty: number): number[][] {
  const solution = generateSolution();
  const puzzle = solution.map(row => [...row]);
  let toRemove = SIDE * SIDE - DIFFICULTIES[difficulty].clues;

  while (toRemove > 0) {
    const row = Math.floor(Math.random() * SIDE);
    const col = Math.floor(Math.random() * SIDE);
    if (puzzle[row][col] === 0) continue;
    puzzle[row][col] = 0;
    toRemove--;
  }

  return puzzle;
}

function findConflicts(grid: number[][]): Set<string> {
  const conflicts = new Set<string>();

  const mark = (cells: Array<[number, number]>) => {
    const seen = new Map<number, Array<[number, number]>>();
    cells.forEach(([row, col]) => {
      const value = grid[row][col];
      if (!value) return;
      const list = seen.get(value) ?? [];
      list.push([row, col]);
      seen.set(value, list);
    });
    seen.forEach(list => {
      if (list.length > 1) list.forEach(([row, col]) => conflicts.add(`${row},${col}`));
    });
  };

  for (let index = 0; index < SIDE; index++) {
    mark(Array.from({ length: SIDE }, (_, col) => [index, col] as [number, number]));
    mark(Array.from({ length: SIDE }, (_, row) => [row, index] as [number, number]));
  }

  for (let boxRow = 0; boxRow < BOX; boxRow++) {
    for (let boxCol = 0; boxCol < BOX; boxCol++) {
      const cells: Array<[number, number]> = [];
      for (let row = 0; row < BOX; row++) {
        for (let col = 0; col < BOX; col++) {
          cells.push([boxRow * BOX + row, boxCol * BOX + col]);
        }
      }
      mark(cells);
    }
  }

  return conflicts;
}

export default function SudokuPro({ onScoreUpdate, onGameOver, onExit }: SudokuProProps) {
  const [difficulty, setDifficulty] = useState(0);
  const [puzzle, setPuzzle] = useState<number[][]>(() => makePuzzle(0));
  const [grid, setGrid] = useState<number[][]>(() => puzzle.map(row => [...row]));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState<'playing' | 'won'>('playing');
  const [time, setTime] = useState(0);

  const config = DIFFICULTIES[difficulty];
  const conflicts = findConflicts(grid);
  const filled = grid.reduce((sum, row) => sum + row.filter(Boolean).length, 0);

  const reset = useCallback((nextDifficulty = difficulty) => {
    const nextPuzzle = makePuzzle(nextDifficulty);
    setDifficulty(nextDifficulty);
    setPuzzle(nextPuzzle);
    setGrid(nextPuzzle.map(row => [...row]));
    setSelected(null);
    setStatus('playing');
    setTime(0);
    onScoreUpdate?.(0);
  }, [difficulty, onScoreUpdate]);

  useEffect(() => {
    if (status !== 'playing') return;
    const timer = window.setInterval(() => setTime(prev => prev + 1), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  const finish = useCallback((finalGrid: number[][]) => {
    const complete = finalGrid.every(row => row.every(Boolean));
    if (!complete || findConflicts(finalGrid).size > 0) return;
    const score = Math.max(0, config.baseScore - time * 2);
    setStatus('won');
    onScoreUpdate?.(score);
    onGameOver?.(score);
  }, [config.baseScore, time, onScoreUpdate, onGameOver]);

  const setCell = useCallback((value: number) => {
    if (status === 'won' || !selected) return;
    const [row, col] = selected;
    if (puzzle[row][col] !== 0) return;
    const next = grid.map(line => [...line]);
    next[row][col] = value;
    setGrid(next);
    finish(next);
  }, [grid, puzzle, selected, status, finish]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key >= '1' && event.key <= '9') {
        event.preventDefault();
        setCell(Number(event.key));
        return;
      }
      if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') {
        event.preventDefault();
        setCell(0);
        return;
      }
      if (!selected) return;
      const [row, col] = selected;
      const moves: Record<string, [number, number]> = {
        ArrowUp: [Math.max(0, row - 1), col],
        ArrowDown: [Math.min(SIDE - 1, row + 1), col],
        ArrowLeft: [row, Math.max(0, col - 1)],
        ArrowRight: [row, Math.min(SIDE - 1, col + 1)],
      };
      const next = moves[event.key];
      if (next) {
        event.preventDefault();
        setSelected(next);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, setCell]);

  const score = Math.max(0, config.baseScore - time * 2);

  return (
    <div
      className="min-h-screen flex flex-col items-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 55%, #16213e 100%)' }}
    >
      <div className="w-full max-w-2xl flex items-center justify-between py-4">
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
          {[
            { label: '时间', value: `${time}s`, color: '#f59e0b' },
            { label: '进度', value: `${filled}/81`, color: '#06b6d4' },
            { label: '预计得分', value: score, color: '#22c55e' },
          ].map(item => (
            <div key={item.label} className="px-4 py-2 rounded-lg text-center" style={{ background: 'rgba(26,26,46,0.8)', border: `1px solid ${item.color}55` }}>
              <div className="text-xs opacity-70" style={{ color: item.color }}>{item.label}</div>
              <div className="text-lg font-bold" style={{ color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {DIFFICULTIES.map((item, index) => (
          <button
            key={item.name}
            onClick={() => reset(index)}
            className="px-4 py-2 rounded-lg font-bold text-sm"
            style={{
              background: difficulty === index ? 'linear-gradient(135deg, #06b6d4, #a855f7)' : 'rgba(255,255,255,0.08)',
              color: difficulty === index ? '#ffffff' : 'rgba(255,255,255,0.65)',
            }}
          >
            {item.name}
          </button>
        ))}
        <motion.button
          onClick={() => reset()}
          className="px-4 py-2 rounded-lg font-bold text-sm ml-2"
          style={{ background: 'rgba(26,26,46,0.9)', color: '#00d2ff', border: '1px solid rgba(0,210,255,0.4)' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          重新开始
        </motion.button>
      </div>

      <motion.div
        className="relative rounded-2xl p-2"
        style={{ width: 'min(92vw, 450px)', background: 'rgba(15,15,26,0.92)', border: '1px solid rgba(0,210,255,0.25)' }}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="grid" style={{ gridTemplateColumns: `repeat(${SIDE}, minmax(0, 1fr))` }}>
          {grid.map((row, rowIndex) => row.map((value, colIndex) => {
            const isGiven = puzzle[rowIndex][colIndex] !== 0;
            const isSelected = selected?.[0] === rowIndex && selected?.[1] === colIndex;
            const isConflict = conflicts.has(`${rowIndex},${colIndex}`);
            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => setSelected([rowIndex, colIndex])}
                className="flex items-center justify-center select-none font-bold"
                style={{
                  aspectRatio: '1 / 1',
                  fontSize: '1.25rem',
                  color: isConflict ? '#ef4444' : isGiven ? '#00d2ff' : '#ffffff',
                  background: isSelected
                    ? 'rgba(6,182,212,0.28)'
                    : isGiven
                      ? 'rgba(255,255,255,0.05)'
                      : 'transparent',
                  borderRight: (colIndex + 1) % BOX === 0 && colIndex !== SIDE - 1 ? '2px solid rgba(0,210,255,0.35)' : '1px solid rgba(255,255,255,0.06)',
                  borderBottom: (rowIndex + 1) % BOX === 0 && rowIndex !== SIDE - 1 ? '2px solid rgba(0,210,255,0.35)' : '1px solid rgba(255,255,255,0.06)',
                  borderTop: rowIndex === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  borderLeft: colIndex === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                {value || ''}
              </button>
            );
          }))}
        </div>

        {status === 'won' && (
          <motion.div
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center"
            style={{ background: 'rgba(10,10,20,0.9)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-3xl font-bold mb-2" style={{ color: '#22c55e' }}>数独完成！</div>
            <div className="text-lg mb-4" style={{ color: '#eab308' }}>得分 {score} · 用时 {time}s</div>
            <motion.button
              onClick={() => reset()}
              className="px-6 py-2.5 rounded-xl font-bold"
              style={{ background: 'linear-gradient(135deg, #22c55e, #06b6d4)', color: '#0a0a1a' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              再来一局
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      <div className="grid grid-cols-5 gap-2 mt-5" style={{ width: 'min(92vw, 450px)' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(value => (
          <button
            key={value}
            onClick={() => setCell(value)}
            className="py-3 rounded-xl font-bold text-lg"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            {value}
          </button>
        ))}
        <button
          onClick={() => setCell(0)}
          className="py-3 rounded-xl font-bold text-sm"
          style={{ background: 'rgba(239,68,68,0.18)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)' }}
        >
          清除
        </button>
      </div>

      <div className="text-xs mt-4 text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
        点击格子后使用键盘 1-9 输入，方向键移动，Backspace 清除；冲突数字会标红
      </div>
    </div>
  );
}
