import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { SNAKE_CONSTANTS, STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { GameSnakeEngine, Direction, Position } from './engine';

const { GRID_SIZE, CANVAS_SIZE } = SNAKE_CONSTANTS;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

interface SnakeProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

export default function Snake({ onScoreUpdate, onGameOver, onExit }: SnakeProps) {
  const [engine] = useState(() => new GameSnakeEngine());
  const [snake, setSnake] = useState<Position[]>(() => engine.getState().snake);
  const [food, setFood] = useState<Position>(() => engine.getState().food);
  const [score, setScore] = useState(() => engine.getState().score);
  const [isGameOver, setIsGameOver] = useState(false);
  const [speed, setSpeed] = useState(() => engine.getState().speed);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.SNAKE);

  const engineRef = useRef(engine);
  engineRef.current = engine;

  const handleTick = useCallback(() => {
    const currentEngine = engineRef.current;
    currentEngine.tick();
    const state = currentEngine.getState();

    setSnake([...state.snake]);
    setFood({ ...state.food });
    setScore(state.score);
    setSpeed(state.speed);
    onScoreUpdate(state.score);

    if (state.isGameOver) {
      setIsGameOver(true);
      updateScore(state.score);
      onGameOver(state.score);
    }
  }, [onScoreUpdate, onGameOver, updateScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'Up':
        case 'w':
        case 'W':
          e.preventDefault();
          e.stopPropagation();
          engineRef.current.setDirection('up');
          break;
        case 'ArrowDown':
        case 'Down':
        case 's':
        case 'S':
          e.preventDefault();
          e.stopPropagation();
          engineRef.current.setDirection('down');
          break;
        case 'ArrowLeft':
        case 'Left':
        case 'a':
        case 'A':
          e.preventDefault();
          e.stopPropagation();
          engineRef.current.setDirection('left');
          break;
        case 'ArrowRight':
        case 'Right':
        case 'd':
        case 'D':
          e.preventDefault();
          e.stopPropagation();
          engineRef.current.setDirection('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isGameOver]);

  useGameLoop({ callback: handleTick, delay: speed, enabled: !isGameOver });

  const handleRestart = useCallback(() => {
    engine.reset();
    const state = engine.getState();
    setSnake([...state.snake]);
    setFood({ ...state.food });
    setScore(state.score);
    setSpeed(state.speed);
    setIsGameOver(false);
    onScoreUpdate(state.score);
  }, [engine, onScoreUpdate]);

  const getSnakeGradient = (index: number, total: number) => {
    const ratio = index / total;
    const r = Math.round(255 * (0.4 + 0.6 * ratio));
    const g = Math.round(46 * (0.4 + 0.6 * ratio));
    const b = Math.round(99 * (0.4 + 0.6 * ratio));
    return `rgb(${r}, ${g}, ${b})`;
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
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          backgroundColor: NEON_COLORS.darkPurple,
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30, inset 0 0 50px rgba(0,0,0,0.5)`,
          border: `2px solid ${NEON_COLORS.neonPink}40`
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`
          }}
        />

        {snake.map((segment, index) => (
          <motion.div
            key={index}
            className="absolute rounded-sm"
            initial={{ scale: index === 0 ? 1.2 : 0.8 }}
            animate={{ scale: 1 }}
            style={{
              left: segment.x * CELL_SIZE,
              top: segment.y * CELL_SIZE,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
              backgroundColor: getSnakeGradient(index, snake.length),
              boxShadow: index === 0
                ? `0 0 15px ${NEON_COLORS.neonPink}, inset 0 0 10px rgba(255,255,255,0.3)`
                : `0 0 5px ${getSnakeGradient(index, snake.length)}`
            }}
          >
            {index === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: NEON_COLORS.white }}
                />
              </div>
            )}
          </motion.div>
        ))}

        <motion.div
          className="absolute rounded-full"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{
            left: food.x * CELL_SIZE,
            top: food.y * CELL_SIZE,
            width: CELL_SIZE - 2,
            height: CELL_SIZE - 2,
            backgroundColor: NEON_COLORS.neonPink,
            boxShadow: `0 0 20px ${NEON_COLORS.neonPink}, 0 0 40px ${NEON_COLORS.neonPink}50`
          }}
        />

        {isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>游戏结束</div>
            <div className="text-2xl mb-2" style={{ color: NEON_COLORS.gold }}>最终得分: {score}</div>
            <div className="text-lg mb-6" style={{ color: NEON_COLORS.neonBlue }}>
              蛇身长度: {snake.length}
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
        <div>使用 方向键 / WASD 控制方向</div>
        <div className="text-sm mt-1">吃满5个食物加速</div>
      </div>
    </div>
  );
}
