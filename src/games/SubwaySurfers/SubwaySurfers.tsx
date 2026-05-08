import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { GameSubwayEngine, Obstacle } from './engine';

interface SubwaySurfersProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const LANE_WIDTH = 80;
const LANES = 3;
const CANVAS_WIDTH = LANE_WIDTH * LANES;
const CANVAS_HEIGHT = 500;
const PLAYER_SIZE = 60;

export default function SubwaySurfers({ onScoreUpdate, onGameOver, onExit }: SubwaySurfersProps) {
  const [engine] = useState(() => new GameSubwayEngine());
  const [player, setPlayer] = useState(() => engine.getState().player);
  const [obstacles, setObstacles] = useState<Obstacle[]>(() => engine.getState().obstacles);
  const [score, setScore] = useState(() => engine.getState().score);
  const [coins, setCoins] = useState(() => engine.getState().coins);
  const [distance, setDistance] = useState(() => engine.getState().distance);
  const [speed, setSpeed] = useState(() => engine.getState().speed);
  const [isGameOver, setIsGameOver] = useState(false);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.SUBWAY);

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setObstacles([...state.obstacles]);
    setScore(state.score);
    setCoins(state.coins);
    setDistance(state.distance);
    setSpeed(state.speed);
    onScoreUpdate(state.score);

    if (state.isGameOver) {
      setIsGameOver(true);
      updateScore(state.score);
      onGameOver(state.score);
    }
  }, [engine, onScoreUpdate, onGameOver, updateScore]);

  useGameLoop({ callback: handleTick, delay: 16, enabled: !isGameOver });

  useKeyboard({
    onArrowLeft: () => engine.moveLeft(),
    onArrowRight: () => engine.moveRight(),
    onArrowUp: () => engine.jump(),
    onArrowDown: () => engine.slide(),
    onA: () => engine.moveLeft(),
    onD: () => engine.moveRight(),
    onW: () => engine.jump(),
    onS: () => engine.slide(),
    onSpace: () => engine.jump(),
    enabled: !isGameOver
  });

  const handleRestart = useCallback(() => {
    engine.reset();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setObstacles([...state.obstacles]);
    setScore(state.score);
    setCoins(state.coins);
    setDistance(state.distance);
    setSpeed(state.speed);
    setIsGameOver(false);
    onScoreUpdate(state.score);
  }, [engine, onScoreUpdate]);

  const renderObstacle = (obs: Obstacle, index: number) => {
    if (obs.type === 'coin') {
      return (
        <motion.div
          key={`obs-${index}`}
          className="absolute flex items-center justify-center text-2xl"
          style={{
            left: obs.x,
            top: obs.y,
            width: obs.width,
            height: obs.height
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          🪙
        </motion.div>
      );
    }

    return (
      <motion.div
        key={`obs-${index}`}
        className="absolute rounded-lg"
        style={{
          left: obs.x,
          top: obs.y,
          width: obs.width,
          height: obs.height,
          backgroundColor: obs.type === 'low' ? '#e74c3c' : '#f39c12',
          boxShadow: `0 0 20px ${obs.type === 'low' ? '#e74c3c' : '#f39c12'}`
        }}
      />
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[300px] px-4">
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
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>距离</div>
          <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{Math.floor(distance)}m</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.bestScore}m</div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center gap-1">
          <span className="text-xl">🪙</span>
          <span className="font-bold" style={{ color: '#f1c40f' }}>{coins}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm" style={{ color: NEON_COLORS.gold }}>速度</span>
          <span className="font-bold" style={{ color: NEON_COLORS.neonBlue }}>{speed.toFixed(1)}x</span>
        </div>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          background: `linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #2c3e50 100%)`,
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
          border: `2px solid ${NEON_COLORS.neonPink}40`
        }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 h-12"
          style={{
            background: `repeating-linear-gradient(90deg, ${NEON_COLORS.neonPink}40 0px, ${NEON_COLORS.neonPink}40 40px, transparent 40px, transparent 80px)`
          }}
        />

        {Array(LANES - 1).fill(0).map((_, i) => (
          <div
            key={`lane-${i}`}
            className="absolute top-0 bottom-0 w-0.5"
            style={{
              left: (i + 1) * LANE_WIDTH,
              backgroundColor: `${NEON_COLORS.neonBlue}40`
            }}
          />
        ))}

        {obstacles.map((obs, i) => renderObstacle(obs, i))}

        <motion.div
          className="absolute"
          style={{
            left: player.x,
            top: player.y,
            width: PLAYER_SIZE,
            height: player.isSliding ? PLAYER_SIZE - 30 : PLAYER_SIZE
          }}
          animate={{
            y: player.y
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div
            className="w-full h-full rounded-xl flex items-center justify-center text-4xl"
            style={{
              background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonBlue})`,
              boxShadow: `0 0 30px ${NEON_COLORS.neonPink}`,
              transform: player.isSliding ? 'rotate(90deg) scaleY(0.5)' : 'none'
            }}
          >
            🏃
          </div>
        </motion.div>

        {isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
              💥 撞到了!
            </div>
            <div className="text-2xl mb-2" style={{ color: NEON_COLORS.gold }}>
              距离: {Math.floor(distance)}m
            </div>
            <div className="text-lg mb-6" style={{ color: NEON_COLORS.neonBlue }}>
              🪙 {coins}
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
                再跑一次
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
                返回
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="flex gap-4 mt-4">
        <motion.button
          onClick={() => engine.moveLeft()}
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
          style={{
            backgroundColor: NEON_COLORS.darkPurple,
            color: NEON_COLORS.neonBlue,
            boxShadow: `0 0 15px ${NEON_COLORS.neonBlue}40`,
            border: `2px solid ${NEON_COLORS.neonBlue}`
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          ←
        </motion.button>

        <div className="flex flex-col gap-2">
          <motion.button
            onClick={() => engine.jump()}
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{
              backgroundColor: NEON_COLORS.neonPink,
              color: NEON_COLORS.white,
              boxShadow: `0 0 15px ${NEON_COLORS.neonPink}60`
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            ↑
          </motion.button>
          <motion.button
            onClick={() => engine.slide()}
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{
              backgroundColor: NEON_COLORS.neonPink,
              color: NEON_COLORS.white,
              boxShadow: `0 0 15px ${NEON_COLORS.neonPink}60`
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            ↓
          </motion.button>
        </div>

        <motion.button
          onClick={() => engine.moveRight()}
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
          style={{
            backgroundColor: NEON_COLORS.darkPurple,
            color: NEON_COLORS.neonBlue,
            boxShadow: `0 0 15px ${NEON_COLORS.neonBlue}40`,
            border: `2px solid ${NEON_COLORS.neonBlue}`
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          →
        </motion.button>
      </div>

      <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.gold }}>
        <div>← → 换道 | ↑ 跳 | ↓ 滑</div>
        <div>空格键也可以跳跃</div>
      </div>
    </div>
  );
}
