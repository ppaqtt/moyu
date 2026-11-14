import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface MinesweeperProProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
  onExit?: () => void;
}

interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
}

type Status = 'ready' | 'playing' | 'won' | 'lost';

const DIFFICULTIES = [
  { name: '简单', rows: 9, cols: 9, mines: 10, cell: 34 },
  { name: '中等', rows: 16, cols: 16, mines: 40, cell: 28 },
  { name: '困难', rows: 16, cols: 30, mines: 99, cell: 24 },
];

const NUMBER_COLORS = ['', '#3b82f6', '#22c55e', '#ef4444', '#a855f7', '#f97316', '#06b6d4', '#e11d48', '#94a3b8'];

function createBoard(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({
    mine: false,
    revealed: false,
    flagged: false,
    adjacent: 0,
  })));
}

function inBounds(row: number, col: number, rows: number, cols: number) {
  return row >= 0 && row < rows && col >= 0 && col < cols;
}

function neighbors(row: number, col: number, rows: number, cols: number) {
  const result: Array<[number, number]> = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (inBounds(nextRow, nextCol, rows, cols)) result.push([nextRow, nextCol]);
    }
  }
  return result;
}

function plantMines(board: Cell[][], rows: number, cols: number, mineCount: number, safeRow: number, safeCol: number): Cell[][] {
  const next = board.map(row => row.map(cell => ({ ...cell })));
  const safe = new Set<string>([`${safeRow},${safeCol}`]);
  neighbors(safeRow, safeCol, rows, cols).forEach(([row, col]) => safe.add(`${row},${col}`));

  const candidates: Array<[number, number]> = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!safe.has(`${row},${col}`)) candidates.push([row, col]);
    }
  }

  for (let index = candidates.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [candidates[index], candidates[swap]] = [candidates[swap], candidates[index]];
  }

  candidates.slice(0, mineCount).forEach(([row, col]) => {
    next[row][col].mine = true;
  });

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (next[row][col].mine) continue;
      next[row][col].adjacent = neighbors(row, col, rows, cols)
        .filter(([nextRow, nextCol]) => next[nextRow][nextCol].mine).length;
    }
  }

  return next;
}

export default function MinesweeperPro({ onScoreUpdate, onGameOver, onExit }: MinesweeperProProps) {
  const [difficulty, setDifficulty] = useState(0);
  const config = DIFFICULTIES[difficulty];
  const [board, setBoard] = useState<Cell[][]>(() => createBoard(config.rows, config.cols));
  const [status, setStatus] = useState<Status>('ready');
  const [time, setTime] = useState(0);

  const flagCount = board.reduce((sum, row) => sum + row.filter(cell => cell.flagged).length, 0);
  const liveScore = Math.max(0, config.mines * 100 - time * 2);

  const reset = useCallback((nextDifficulty = difficulty) => {
    const nextConfig = DIFFICULTIES[nextDifficulty];
    setDifficulty(nextDifficulty);
    setBoard(createBoard(nextConfig.rows, nextConfig.cols));
    setStatus('ready');
    setTime(0);
    onScoreUpdate?.(0);
  }, [difficulty, onScoreUpdate]);

  useEffect(() => {
    if (status !== 'playing') return;
    const timer = window.setInterval(() => setTime(prev => prev + 1), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  const reveal = (row: number, col: number) => {
    if (status === 'won' || status === 'lost') return;
    let working = board;
    let nextStatus = status;

    if (status === 'ready') {
      working = plantMines(board, config.rows, config.cols, config.mines, row, col);
      nextStatus = 'playing';
    }

    const target = working[row][col];
    if (target.flagged || target.revealed) return;

    const next = working.map(line => line.map(cell => ({ ...cell })));

    if (next[row][col].mine) {
      next[row][col].revealed = true;
      next.forEach((line, rowIndex) => line.forEach((cell, colIndex) => {
        if (cell.mine) next[rowIndex][colIndex].revealed = true;
      }));
      setBoard(next);
      setStatus('lost');
      onScoreUpdate?.(0);
      onGameOver?.(0);
      return;
    }

    const stack: Array<[number, number]> = [[row, col]];

    while (stack.length) {
      const [currentRow, currentCol] = stack.pop()!;
      const cell = next[currentRow][currentCol];
      if (cell.revealed || cell.flagged || cell.mine) continue;

      cell.revealed = true;

      if (cell.adjacent === 0) {
        neighbors(currentRow, currentCol, config.rows, config.cols).forEach(([nextRow, nextCol]) => {
          const neighbor = next[nextRow][nextCol];
          if (!neighbor.revealed && !neighbor.flagged) stack.push([nextRow, nextCol]);
        });
      }
    }

    const totalRevealed = next.reduce((sum, line) => sum + line.filter(cell => cell.revealed && !cell.mine).length, 0);
    const won = totalRevealed === config.rows * config.cols - config.mines;

    setBoard(next);
    setStatus(won ? 'won' : nextStatus);
    onScoreUpdate?.(won ? liveScore : 0);

    if (won) {
      onGameOver?.(liveScore);
    }
  };

  const toggleFlag = (event: React.MouseEvent, row: number, col: number) => {
    event.preventDefault();
    if (status !== 'playing' && status !== 'ready') return;
    if (status === 'ready') return;
    setBoard(prev => prev.map((line, rowIndex) => line.map((cell, colIndex) => {
      if (rowIndex !== row || colIndex !== col) return cell;
      if (cell.revealed) return cell;
      return { ...cell, flagged: !cell.flagged };
    })));
  };

  const statusText = status === 'ready'
    ? '点击任意格子开始（首点安全）'
    : status === 'playing'
      ? '进行中'
      : status === 'won'
        ? `排雷完成！得分 ${liveScore}`
        : '踩到地雷了';

  return (
    <div
      className="min-h-screen flex flex-col items-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 55%, #16213e 100%)' }}
    >
      <div className="w-full max-w-5xl flex items-center justify-between py-4">
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
            { label: '剩余雷数', value: config.mines - flagCount, color: '#ef4444' },
            { label: '时间', value: `${time}s`, color: '#f59e0b' },
            { label: '预计得分', value: liveScore, color: '#22c55e' },
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

      <div
        className="text-sm mb-3"
        style={{ color: status === 'lost' ? '#ef4444' : status === 'won' ? '#22c55e' : 'rgba(255,255,255,0.6)' }}
      >
        {statusText}
      </div>

      <div className="overflow-auto max-w-full pb-6">
        <div
          className="grid gap-[2px] p-2 rounded-xl"
          style={{
            gridTemplateColumns: `repeat(${config.cols}, ${config.cell}px)`,
            background: 'rgba(15,15,26,0.9)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          onContextMenu={event => event.preventDefault()}
        >
          {board.map((row, rowIndex) => row.map((cell, colIndex) => {
            let content = '';
            let color = '#ffffff';
            if (cell.revealed) {
              if (cell.mine) {
                content = '💣';
              } else if (cell.adjacent > 0) {
                content = String(cell.adjacent);
                color = NUMBER_COLORS[cell.adjacent];
              }
            } else if (cell.flagged) {
              content = '🚩';
            }

            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => reveal(rowIndex, colIndex)}
                onContextMenu={event => toggleFlag(event, rowIndex, colIndex)}
                className="flex items-center justify-center rounded-[3px] font-bold select-none"
                style={{
                  width: config.cell,
                  height: config.cell,
                  fontSize: config.cell * 0.5,
                  color,
                  background: cell.revealed
                    ? cell.mine
                      ? 'rgba(239,68,68,0.35)'
                      : 'rgba(255,255,255,0.06)'
                    : 'linear-gradient(135deg, #2b2b45, #22223a)',
                  border: cell.revealed ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.12)',
                  cursor: cell.revealed ? 'default' : 'pointer',
                }}
              >
                {content}
              </button>
            );
          }))}
        </div>
      </div>

      <div className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
        左键翻开 · 开局后右键插旗 / 取消插旗 · 首点及其周围不会埋雷
      </div>
    </div>
  );
}
