import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { GameBejeweledEngine, Gem } from './engine';

interface BejeweledProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const BOARD_SIZE = 8;
const CELL_SIZE = 50;
const GEM_ICONS = ['💎', '💠', '🔮', '💜', '💛', '🟡', '🔶'];
const GEM_COLORS = ['#3498db', '#00f5ff', '#9b59b6', '#8e44ad', '#f1c40f', '#f39c12', '#e67e22'];

export default function Bejeweled({ onScoreUpdate, onGameOver, onExit }: BejeweledProps) {
  const [engine] = useState(() => new GameBejeweledEngine());
  const [board, setBoard] = useState(() => engine.getState().board);
  const [score, setScore] = useState(() => engine.getState().score);
  const [combo, setCombo] = useState(0);
  const [level, setLevel] = useState(() => engine.getState().level);
  const [targetScore, setTargetScore] = useState(() => engine.getState().targetScore);
  const [isAnimating, setIsAnimating] = useState(false);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.BEJEWEL);

  const updateState = useCallback(() => {
    const state = engine.getState();
    setBoard([...state.board.map(row => [...row])]);
    setScore(state.score);
    setCombo(state.combo);
    setLevel(state.level);
    setTargetScore(state.targetScore);
    onScoreUpdate(state.score);
  }, [engine, onScoreUpdate]);

  const handleGemClick = useCallback((row: number, col: number) => {
    if (isAnimating) return;

    const moved = engine.selectGem(row, col);
    if (moved) {
      setIsAnimating(true);
      updateState();

      setTimeout(() => {
        const matches = true;
        if (matches) {
          updateState();
        }
        setIsAnimating(false);
      }, 600);
    } else {
      updateState();
    }
  }, [engine, updateState, isAnimating]);

  const handleRestart = useCallback(() => {
    engine.reset();
    updateState();
  }, [engine, updateState]);

  const progressPercent = Math.min((score / targetScore) * 100, 100);

  const renderGem = (gem: Gem, row: number, col: number) => {
    const isSelected = gem.isSelected;
    const isMatched = gem.isMatched;
    const isNew = gem.isNew;

    if (gem.type === -1) return null;

    return (
      <motion.div
        key={`${row}-${col}-${gem.type}`}
        className="absolute cursor-pointer flex items-center justify-center text-3xl select-none"
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          left: col * CELL_SIZE,
          top: row * CELL_SIZE,
          filter: isMatched ? 'brightness(1.5)' : 'brightness(1)',
          zIndex: isSelected ? 10 : 1
        }}
        initial={isNew ? { scale: 0, rotate: 180 } : false}
        animate={isMatched ? { scale: 1.3, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        onClick={() => handleGemClick(row, col)}
      >
        <motion.div
          className="w-full h-full rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: `${GEM_COLORS[gem.type]}40`,
            border: isSelected ? `3px solid ${GEM_COLORS[gem.type]}` : 'none',
            boxShadow: isSelected 
              ? `0 0 20px ${GEM_COLORS[gem.type]}, 0 0 40px ${GEM_COLORS[gem.type]}80` 
              : `0 0 10px ${GEM_COLORS[gem.type]}40`,
            transform: isSelected ? 'scale(1.1)' : 'scale(1)'
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {GEM_ICONS[gem.type]}
        </motion.div>
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

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>当前分数</div>
          <div className="text-3xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{score}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高记录</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.bestScore}</div>
        </div>
      </div>

      <div className="flex items-center justify-between w-full max-w-[450px] px-4">
        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>等级</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{level}</div>
        </div>

        <div className="flex-1 mx-4">
          <div className="text-xs text-center mb-1" style={{ color: NEON_COLORS.gold }}>
            目标: {targetScore}
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: NEON_COLORS.darkPurple }}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: NEON_COLORS.neonBlue }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
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
      </div>

      <AnimatePresence>
        {combo > 1 && (
          <motion.div
            className="text-2xl font-bold"
            style={{ color: NEON_COLORS.neonPink }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            {combo}x 连击!
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="relative rounded-2xl p-2"
        style={{
          backgroundColor: NEON_COLORS.darkPurple,
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
          width: BOARD_SIZE * CELL_SIZE + 16,
          height: BOARD_SIZE * CELL_SIZE + 16
        }}
      >
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`
          }}
        >
          {board.map((row, r) =>
            row.map((gem, c) => (
              <div
                key={`cell-${r}-${c}`}
                className="rounded-lg"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  width: CELL_SIZE,
                  height: CELL_SIZE
                }}
              />
            ))
          )}
        </div>

        <div className="absolute inset-2">
          {board.map((row, r) =>
            row.map((gem, c) => renderGem(gem, r, c))
          )}
        </div>
      </div>

      <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.gold }}>
        <div>点击宝石选中，再次点击相邻宝石交换</div>
        <div>匹配3个或更多相同宝石得分</div>
      </div>
    </div>
  );
}
