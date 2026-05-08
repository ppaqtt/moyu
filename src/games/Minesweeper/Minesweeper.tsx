import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { GameMinesweeperEngine, Cell } from './engine';

interface MinesweeperProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const CELL_SIZE = 30;
const DIFFICULTIES = [
  { name: '简单', rows: 9, cols: 9, mines: 10 },
  { name: '中等', rows: 16, cols: 16, mines: 40 },
  { name: '困难', rows: 16, cols: 30, mines: 99 }
];

const NUMBER_COLORS: Record<number, string> = {
  1: '#3498db',
  2: '#27ae60',
  3: '#e74c3c',
  4: '#9b59b6',
  5: '#e67e22',
  6: '#1abc9c',
  7: '#2c3e50',
  8: '#7f8c8d'
};

export default function Minesweeper({ onScoreUpdate, onGameOver, onExit }: MinesweeperProps) {
  const [difficulty, setDifficulty] = useState(1);
  const [engine] = useState(() => new GameMinesweeperEngine(
    DIFFICULTIES[difficulty].rows,
    DIFFICULTIES[difficulty].cols,
    DIFFICULTIES[difficulty].mines
  ));
  const [board, setBoard] = useState(() => engine.getState().board);
  const [flags, setFlags] = useState(() => engine.getState().flags);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [time, setTime] = useState(0);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.MINESWEEPER);

  const handleReveal = useCallback((row: number, col: number) => {
    if (isGameOver || isWon) return;
    engine.reveal(row, col);
    const state = engine.getState();
    setBoard([...state.board.map(r => [...r])]);
    setFlags(state.flags);
    setScore(state.score);
    setTime(state.time);
    setIsGameOver(state.isGameOver);
    setIsWon(state.isWon);
    onScoreUpdate(state.score);

    if (state.isGameOver) {
      updateScore(state.score);
      onGameOver(state.score);
    }
    if (state.isWon) {
      updateScore(state.score);
    }
  }, [engine, isGameOver, isWon, onScoreUpdate, onGameOver, updateScore]);

  const handleRightClick = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    if (isGameOver || isWon) return;
    engine.toggleFlag(row, col);
    const state = engine.getState();
    setBoard([...state.board.map(r => [...r])]);
    setFlags(state.flags);
  }, [engine, isGameOver, isWon]);

  const handleRestart = useCallback(() => {
    engine.reset();
    const state = engine.getState();
    setBoard([...state.board.map(r => [...r])]);
    setFlags(state.flags);
    setScore(0);
    setIsGameOver(false);
    setIsWon(false);
    setTime(0);
    onScoreUpdate(0);
  }, [engine, onScoreUpdate]);

  const handleDifficultyChange = useCallback((index: number) => {
    setDifficulty(index);
    const diff = DIFFICULTIES[index];
    const newEngine = new GameMinesweeperEngine(diff.rows, diff.cols, diff.mines);
    Object.setPrototypeOf(newEngine, Object.getPrototypeOf(engine));
    const state = newEngine.getState();
    setBoard([...state.board.map(r => [...r])]);
    setFlags(state.flags);
    setScore(0);
    setIsGameOver(false);
    setIsWon(false);
    setTime(0);
  }, [engine, onScoreUpdate]);

  const { rows, cols, mines } = DIFFICULTIES[difficulty];

  const renderCell = (cell: Cell, row: number, col: number) => {
    const size = difficulty === 2 ? 25 : CELL_SIZE;

    return (
      <motion.div
        key={`${row}-${col}`}
        className="cursor-pointer select-none flex items-center justify-center font-bold rounded transition-all"
        style={{
          width: size,
          height: size,
          backgroundColor: cell.isRevealed ? '#2c3e50' : '#34495e',
          border: cell.isRevealed ? 'none' : '2px solid #4a5568',
          color: cell.isRevealed && cell.adjacentMines > 0 ? NUMBER_COLORS[cell.adjacentMines] : 'transparent',
          fontSize: size * 0.6
        }}
        whileHover={{ scale: cell.isRevealed ? 1 : 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleReveal(row, col)}
        onContextMenu={(e) => handleRightClick(e, row, col)}
      >
        {cell.isRevealed && cell.isMine && '💣'}
        {cell.isRevealed && !cell.isMine && cell.adjacentMines > 0 && cell.adjacentMines}
        {!cell.isRevealed && cell.isFlagged && '🚩'}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-3xl px-4">
        <motion.button
          onClick={onExit}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{
            backgroundColor: NEON_COLORS.darkPurple,
            color: NEON_COLORS.neonBlue,
            boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}40`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="flex gap-2">
          {DIFFICULTIES.map((diff, index) => (
            <motion.button
              key={diff.name}
              onClick={() => handleDifficultyChange(index)}
              className="px-3 py-1 rounded text-sm font-bold"
              style={{
                backgroundColor: difficulty === index ? NEON_COLORS.neonPink : NEON_COLORS.darkPurple,
                color: difficulty === index ? NEON_COLORS.white : NEON_COLORS.neonBlue,
                border: `1px solid ${difficulty === index ? NEON_COLORS.neonPink : NEON_COLORS.neonBlue}`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {diff.name}
            </motion.button>
          ))}
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高记录</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.bestScore}</div>
        </div>
      </div>

      <div className="flex items-center justify-between w-full max-w-3xl px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚩</span>
            <span className="font-bold" style={{ color: NEON_COLORS.neonPink }}>
              {mines - flags}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⏱️</span>
            <span className="font-bold" style={{ color: NEON_COLORS.neonBlue }}>
              {time}s
            </span>
          </div>
        </div>

        <motion.button
          onClick={handleRestart}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{
            backgroundColor: NEON_COLORS.neonPink,
            color: NEON_COLORS.white,
            boxShadow: `0 0 10px ${NEON_COLORS.neonPink}`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          重新开始
        </motion.button>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>得分</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{score}</div>
        </div>
      </div>

      <div
        className="rounded-xl p-2 overflow-auto"
        style={{
          backgroundColor: NEON_COLORS.darkPurple,
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
          maxWidth: '90vw'
        }}
      >
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${difficulty === 2 ? 25 : CELL_SIZE}px)`
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => renderCell(cell, r, c))
          )}
        </div>
      </div>

      {(isGameOver || isWon) && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="text-center p-8 rounded-2xl"
            style={{ backgroundColor: NEON_COLORS.darkPurple }}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            <div className="text-4xl font-bold mb-4" style={{ color: isWon ? NEON_COLORS.neonBlue : NEON_COLORS.neonPink }}>
              {isWon ? '🎉 恭喜通关!' : '💥 游戏结束'}
            </div>
            <div className="text-2xl mb-2" style={{ color: NEON_COLORS.gold }}>
              最终得分: {score}
            </div>
            <div className="text-lg mb-6" style={{ color: NEON_COLORS.gold }}>
              用时: {time}秒
            </div>
            <div className="flex gap-4 justify-center">
              <motion.button
                onClick={handleRestart}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: NEON_COLORS.neonPink,
                  color: NEON_COLORS.white,
                  boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                再玩一次
              </motion.button>
              <motion.button
                onClick={onExit}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: 'transparent',
                  color: NEON_COLORS.neonBlue,
                  border: `2px solid ${NEON_COLORS.neonBlue}`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                返回首页
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.gold }}>
        <div>左键点击揭示 | 右键标记地雷</div>
      </div>
    </div>
  );
}
