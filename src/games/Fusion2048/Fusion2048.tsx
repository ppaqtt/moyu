import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { FUSION_CONSTANTS, STORAGE_KEYS, TILE_COLORS, NEON_COLORS } from '../../utils/constants';
import { GameFusionEngine, Position } from './engine';

const { GRID_SIZE, TILE_SIZE, GAP, CANVAS_WIDTH, CANVAS_HEIGHT } = FUSION_CONSTANTS;

interface Fusion2048Props {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

export default function Fusion2048({ onScoreUpdate, onGameOver, onExit }: Fusion2048Props) {
  const [engine] = useState(() => new GameFusionEngine());
  const [grid, setGrid] = useState(() => engine.getState().grid);
  const [currentPiece, setCurrentPiece] = useState(() => engine.getState().currentPiece);
  const [currentPosition, setCurrentPosition] = useState<Position>(() => engine.getState().currentPosition);
  const [score, setScore] = useState(() => engine.getState().score);
  const [isGameOver, setIsGameOver] = useState(false);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.FUSION_2048);

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setGrid([...state.grid.map(row => [...row])]);
    setCurrentPiece(state.currentPiece ? { ...state.currentPiece } : null);
    setCurrentPosition({ ...state.currentPosition });
    setScore(state.score);
    onScoreUpdate(state.score);

    if (state.isGameOver) {
      setIsGameOver(true);
      updateScore(state.score);
      onGameOver(state.score);
    }
  }, [engine, onScoreUpdate, onGameOver, updateScore]);

  useGameLoop({ callback: handleTick, delay: 100, enabled: !isGameOver });

  const handleMove = useCallback((direction: 'left' | 'right' | 'down') => {
    engine.move(direction);
    const state = engine.getState();
    setGrid([...state.grid.map(row => [...row])]);
    setCurrentPiece(state.currentPiece ? { ...state.currentPiece } : null);
    setCurrentPosition({ ...state.currentPosition });
    setScore(state.score);
    onScoreUpdate(state.score);

    if (state.isGameOver) {
      setIsGameOver(true);
      updateScore(state.score);
      onGameOver(state.score);
    }
  }, [engine, onScoreUpdate, onGameOver, updateScore]);

  const handleRotate = useCallback(() => {
    engine.rotate();
    const state = engine.getState();
    setCurrentPiece(state.currentPiece ? { ...state.currentPiece } : null);
  }, [engine]);

  const handleHardDrop = useCallback(() => {
    engine.hardDrop();
    const state = engine.getState();
    setGrid([...state.grid.map(row => [...row])]);
    setCurrentPiece(state.currentPiece ? { ...state.currentPiece } : null);
    setCurrentPosition({ ...state.currentPosition });
    setScore(state.score);
    onScoreUpdate(state.score);

    if (state.isGameOver) {
      setIsGameOver(true);
      updateScore(state.score);
      onGameOver(state.score);
    }
  }, [engine, onScoreUpdate, onGameOver, updateScore]);

  const handleRestart = useCallback(() => {
    engine.reset();
    const state = engine.getState();
    setGrid([...state.grid.map(row => [...row])]);
    setCurrentPiece(state.currentPiece ? { ...state.currentPiece } : null);
    setCurrentPosition({ ...state.currentPosition });
    setScore(state.score);
    setIsGameOver(false);
    onScoreUpdate(state.score);
  }, [engine, onScoreUpdate]);

  useKeyboard({
    onArrowLeft: () => handleMove('left'),
    onArrowRight: () => handleMove('right'),
    onArrowDown: () => handleMove('down'),
    onArrowUp: () => handleRotate(),
    onSpace: () => handleHardDrop(),
    enabled: !isGameOver
  });

  const getTileColor = (value: number) => {
    if (value > 8192) return TILE_COLORS[8192];
    return TILE_COLORS[value] || '#3c3a32';
  };

  const getTextColor = (value: number) => {
    return value <= 4 ? '#776e65' : '#f9f6f2';
  };

  const getFontSize = (value: number) => {
    if (value >= 1000) return '1.5rem';
    if (value >= 100) return '1.8rem';
    return '2.2rem';
  };

  const renderPiece = () => {
    if (!currentPiece) return null;

    return currentPiece.shape.map((row, r) =>
      row.map((cell, c) => {
        if (!cell) return null;
        return (
          <div
            key={`piece-${r}-${c}`}
            className="absolute rounded-lg flex items-center justify-center font-bold"
            style={{
              left: (currentPosition.x + c) * (TILE_SIZE + GAP) + GAP,
              top: (currentPosition.y + r) * (TILE_SIZE + GAP) + GAP,
              width: TILE_SIZE,
              height: TILE_SIZE,
              backgroundColor: getTileColor(currentPiece.value),
              color: getTextColor(currentPiece.value),
              fontSize: getFontSize(currentPiece.value),
              boxShadow: `0 0 20px ${getTileColor(currentPiece.value)}`,
              zIndex: 5
            }}
          >
            {currentPiece.value}
          </div>
        );
      })
    );
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center justify-between w-full max-w-[480px] px-4">
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
        className="relative rounded-2xl p-3"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          backgroundColor: NEON_COLORS.darkPurple,
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30, inset 0 0 20px rgba(0,0,0,0.5)`,
          border: `2px solid ${NEON_COLORS.neonPink}40`
        }}
      >
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${TILE_SIZE}px)`,
            gridTemplateRows: `repeat(5, ${TILE_SIZE}px)`
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => (
              <motion.div
                key={`grid-${r}-${c}`}
                className="rounded-lg flex items-center justify-center font-bold"
                style={{
                  backgroundColor: cell === 0 ? '#16213e' : getTileColor(cell),
                  color: cell === 0 ? 'transparent' : getTextColor(cell),
                  fontSize: cell === 0 ? '0' : getFontSize(cell),
                  boxShadow: cell !== 0 ? `0 0 15px ${getTileColor(cell)}` : 'none'
                }}
              >
                {cell !== 0 && cell}
              </motion.div>
            ))
          )}
        </div>

        {renderPiece()}

        {isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>游戏结束</div>
            <div className="text-2xl mb-6" style={{ color: NEON_COLORS.gold }}>最终得分: {score}</div>
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
        <div>← → 移动 | ↑ 旋转 | ↓ 加速下落 | 空格 立即下落</div>
        <div className="text-sm mt-1">相同数字会自动合并!</div>
      </div>
    </div>
  );
}
