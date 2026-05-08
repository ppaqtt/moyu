import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { GameSudokuEngine, SudokuCell } from './engine';

interface SudokuProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const BOARD_SIZE = 9;
const CELL_SIZE = 45;

const DIFFICULTIES = [
  { name: '简单', cells: 30 },
  { name: '中等', cells: 45 },
  { name: '困难', cells: 55 }
];

export default function Sudoku({ onScoreUpdate, onGameOver, onExit }: SudokuProps) {
  const [difficulty, setDifficulty] = useState(0);
  const [engine] = useState(() => new GameSudokuEngine(difficulty));
  const [board, setBoard] = useState(() => engine.getState().board);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [mistakes, setMistakes] = useState(() => engine.getState().mistakes);
  const [hints, setHints] = useState(() => engine.getState().hints);
  const [isComplete, setIsComplete] = useState(false);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.SUDOKU);

  const updateState = useCallback(() => {
    const state = engine.getState();
    setBoard([...state.board.map(row => [...row])]);
    setSelectedCell(state.selectedCell ? { ...state.selectedCell } : null);
    setMistakes(state.mistakes);
    setHints(state.hints);
    setIsComplete(state.isComplete);
    if (state.isComplete) {
      updateScore(1000 - state.mistakes * 100);
    }
  }, [engine, updateScore]);

  const handleCellClick = useCallback((row: number, col: number) => {
    engine.selectCell(row, col);
    updateState();
  }, [engine, updateState]);

  const handleNumberClick = useCallback((num: number) => {
    engine.enterNumber(num);
    updateState();
    const state = engine.getState();
    if (state.isComplete) {
      onGameOver(1000 - state.mistakes * 100);
    }
  }, [engine, updateState, onGameOver]);

  const handleNoteToggle = useCallback((num: number) => {
    engine.toggleNote(num);
    updateState();
  }, [engine, updateState]);

  const handleHint = useCallback(() => {
    engine.useHint();
    updateState();
  }, [engine, updateState]);

  const handleRestart = useCallback(() => {
    engine.reset();
    updateState();
    setIsComplete(false);
  }, [engine, updateState]);

  const handleDifficultyChange = useCallback((diff: number) => {
    setDifficulty(diff);
    engine.setDifficulty(diff);
    updateState();
    setIsComplete(false);
  }, [engine, updateState]);

  const renderCell = (cell: SudokuCell, row: number, col: number) => {
    const isSelected = cell.isSelected;
    const isHighlighted = selectedCell && 
      (selectedCell.row === row || 
       selectedCell.col === col || 
       (Math.floor(selectedCell.row / 3) === Math.floor(row / 3) && 
        Math.floor(selectedCell.col / 3) === Math.floor(col / 3)));
    const sameValue = selectedCell && board[selectedCell.row][selectedCell.col].value === cell.value && cell.value !== 0;

    return (
      <motion.div
        key={`${row}-${col}`}
        className="cursor-pointer select-none flex items-center justify-center font-bold rounded transition-all"
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          backgroundColor: cell.isError 
            ? '#e74c3c40' 
            : isSelected 
              ? `${NEON_COLORS.neonPink}60` 
              : isHighlighted 
                ? `${NEON_COLORS.neonBlue}20` 
                : sameValue 
                  ? `${NEON_COLORS.neonPink}30` 
                  : '#2c3e50',
          color: cell.isGiven ? '#ecf0f1' : cell.isError ? '#e74c3c' : NEON_COLORS.neonBlue,
          fontSize: '1.2rem',
          border: isSelected ? `2px solid ${NEON_COLORS.neonPink}` : '1px solid #34495e',
          gridColumn: col + 1,
          gridRow: row + 1
        }}
        whileHover={{ backgroundColor: `${NEON_COLORS.neonPink}30` }}
        onClick={() => handleCellClick(row, col)}
      >
        {cell.value !== 0 ? (
          cell.value
        ) : (
          <div className="grid grid-cols-3 gap-0.5 text-xs">
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <div key={n} className="w-3 h-3 flex items-center justify-center" style={{ color: cell.notes.includes(n) ? NEON_COLORS.neonBlue : 'transparent' }}>
                {n}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[450px] px-4">
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

      <div className="flex items-center justify-between w-full max-w-[450px] px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>❌</span>
            <span className="font-bold" style={{ color: mistakes >= 3 ? '#e74c3c' : NEON_COLORS.neonPink }}>
              {mistakes}/3
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>💡</span>
            <span className="font-bold" style={{ color: NEON_COLORS.neonBlue }}>{hints}</span>
          </div>
        </div>

        <motion.button
          onClick={handleHint}
          disabled={hints <= 0}
          className="px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50"
          style={{
            backgroundColor: NEON_COLORS.neonBlue,
            color: NEON_COLORS.white,
            boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          提示
        </motion.button>

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
      </div>

      <div
        className="rounded-2xl p-2"
        style={{
          backgroundColor: NEON_COLORS.darkPurple,
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`
        }}
      >
        <div
          className="grid gap-0"
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
            border: `3px solid ${NEON_COLORS.neonPink}`
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => renderCell(cell, r, c))
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-2">
          {[1,2,3,4,5,6,7,8,9].map(num => (
            <motion.button
              key={num}
              onClick={() => handleNumberClick(num)}
              className="w-10 h-10 rounded-lg font-bold text-xl"
              style={{
                backgroundColor: NEON_COLORS.darkPurple,
                color: NEON_COLORS.neonBlue,
                border: `2px solid ${NEON_COLORS.neonBlue}`
              }}
              whileHover={{ scale: 1.1, backgroundColor: `${NEON_COLORS.neonPink}40` }}
              whileTap={{ scale: 0.95 }}
            >
              {num}
            </motion.button>
          ))}
        </div>

        <div className="flex gap-2">
          <motion.button
            onClick={() => handleNumberClick(0)}
            className="px-6 py-2 rounded-lg font-bold text-sm"
            style={{
              backgroundColor: NEON_COLORS.darkPurple,
              color: NEON_COLORS.neonPink,
              border: `2px solid ${NEON_COLORS.neonPink}`
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            清除
          </motion.button>
          <motion.button
            onClick={() => {/* toggle notes mode */}}
            className="px-6 py-2 rounded-lg font-bold text-sm"
            style={{
              backgroundColor: NEON_COLORS.darkPurple,
              color: NEON_COLORS.neonBlue,
              border: `2px solid ${NEON_COLORS.neonBlue}`
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            笔记
          </motion.button>
        </div>
      </div>

      {isComplete && (
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
            <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonBlue }}>
              🎉 恭喜完成!
            </div>
            <div className="text-2xl mb-6" style={{ color: NEON_COLORS.gold }}>
              完成数独谜题
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
    </div>
  );
}
