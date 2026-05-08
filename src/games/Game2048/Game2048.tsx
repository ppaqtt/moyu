import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { GAME_2048_CONSTANTS, STORAGE_KEYS, TILE_COLORS, NEON_COLORS } from '../../utils/constants';
import { Game2048Engine, Direction } from './engine';

const { GRID_SIZE, TILE_SIZE, GAP, CANVAS_SIZE } = GAME_2048_CONSTANTS;

interface Game2048Props {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

export default function Game2048({ onScoreUpdate, onGameOver, onExit }: Game2048Props) {
  const [engine] = useState(() => new Game2048Engine());
  const [grid, setGrid] = useState(() => engine.getState().grid);
  const [score, setScore] = useState(() => engine.getState().score);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.GAME_2048);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((direction: Direction) => {
    const moved = engine.move(direction);
    if (moved) {
      const state = engine.getState();
      setGrid([...state.grid.map(row => [...row])]);
      setScore(state.score);
      onScoreUpdate(state.score);

      if (state.isGameOver) {
        setIsGameOver(true);
        updateScore(state.score);
        onGameOver(state.score);
      }
      if (state.isWon && !isWon) {
        setIsWon(true);
      }
    }
  }, [engine, onScoreUpdate, onGameOver, updateScore, isWon]);

  const handleRestart = useCallback(() => {
    engine.reset();
    const state = engine.getState();
    setGrid([...state.grid.map(row => [...row])]);
    setScore(state.score);
    setIsGameOver(false);
    setIsWon(false);
    onScoreUpdate(state.score);
  }, [engine, onScoreUpdate]);

  useKeyboard({
    onArrowUp: () => handleMove('up'),
    onArrowDown: () => handleMove('down'),
    onArrowLeft: () => handleMove('left'),
    onArrowRight: () => handleMove('right'),
    onW: () => handleMove('up'),
    onS: () => handleMove('down'),
    onA: () => handleMove('left'),
    onD: () => handleMove('right'),
    enabled: !isGameOver
  });

  const handleTouch = useCallback((e: React.TouchEvent) => {
    if (isGameOver) return;
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;

    const handleTouchEnd = (endEvent: TouchEvent) => {
      const endTouch = endEvent.changedTouches[0];
      const deltaX = endTouch.clientX - startX;
      const deltaY = endTouch.clientY - startY;
      const minSwipe = 50;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > minSwipe) handleMove('right');
        else if (deltaX < -minSwipe) handleMove('left');
      } else {
        if (deltaY > minSwipe) handleMove('down');
        else if (deltaY < -minSwipe) handleMove('up');
      }
    };

    containerRef.current?.addEventListener('touchend', handleTouchEnd, { once: true });
  }, [handleMove, isGameOver]);

  const getTileColor = (value: number) => {
    if (value > 8192) return TILE_COLORS[8192];
    return TILE_COLORS[value] || '#3c3a32';
  };

  const getTextColor = (value: number) => {
    return value <= 4 ? '#776e65' : '#f9f6f2';
  };

  const getFontSize = (value: number) => {
    if (value >= 1000) return '2rem';
    if (value >= 100) return '2.5rem';
    return '3rem';
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center justify-between w-full max-w-[400px] px-4">
        <motion.button
          onClick={onExit}
          className="px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300"
          style={{
            backgroundColor: NEON_COLORS.darkPurple,
            color: NEON_COLORS.neonBlue,
            boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}40`
          }}
          whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${NEON_COLORS.neonBlue}` }}
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
          <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.bestScore}</div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative rounded-2xl p-3 cursor-grab active:cursor-grabbing select-none"
        style={{
          backgroundColor: NEON_COLORS.darkPurple,
          width: CANVAS_SIZE + GAP * 2,
          height: CANVAS_SIZE + GAP * 2,
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30, inset 0 0 20px rgba(0,0,0,0.5)`
        }}
        onTouchStart={handleTouch}
      >
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${TILE_SIZE}px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${TILE_SIZE}px)`
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => (
              <motion.div
                key={`${r}-${c}`}
                className="rounded-lg flex items-center justify-center font-bold"
                style={{
                  backgroundColor: cell === 0 ? '#16213e' : getTileColor(cell),
                  color: cell === 0 ? 'transparent' : getTextColor(cell),
                  fontSize: cell === 0 ? '0' : getFontSize(cell)
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                {cell !== 0 && cell}
              </motion.div>
            ))
          )}
        </div>

        {isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl z-10"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
              {isWon ? '🎉 恭喜通关!' : '游戏结束'}
            </div>
            <div className="text-2xl mb-6" style={{ color: NEON_COLORS.gold }}>
              最终得分: {score}
            </div>
            <div className="flex gap-4">
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
                  backgroundColor: NEON_COLORS.darkPurple,
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
        )}
      </div>

      <div className="text-center opacity-60" style={{ color: NEON_COLORS.gold }}>
        <div>使用 方向键 / WASD 移动</div>
        <div className="text-sm mt-1">或滑动屏幕</div>
      </div>
    </div>
  );
}
