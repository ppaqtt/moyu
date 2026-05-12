import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { WaterRunEngine, Obstacle } from './engine';

interface WaterRunProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const LANE_WIDTH = 80;
const LANES = 3;
const CANVAS_WIDTH = LANE_WIDTH * LANES;
const CANVAS_HEIGHT = 500;
const PLAYER_SIZE = 55;

export default function WaterRun({ onScoreUpdate, onGameOver, onExit }: WaterRunProps) {
  const [engine] = useState(() => new WaterRunEngine());
  const [player, setPlayer] = useState(() => engine.getState().player);
  const [obstacles, setObstacles] = useState<Obstacle[]>(() => engine.getState().obstacles);
  const [score, setScore] = useState(() => engine.getState().score);
  const [coins, setCoins] = useState(() => engine.getState().coins);
  const [distance, setDistance] = useState(() => engine.getState().distance);
  const [speed, setSpeed] = useState(() => engine.getState().speed);
  const [waveOffset, setWaveOffset] = useState(() => engine.getState().waveOffset);
  const [bubbles, setBubbles] = useState(() => engine.getState().bubbles);
  const [isGameOver, setIsGameOver] = useState(false);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.WATER_RUN);

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setObstacles([...state.obstacles]);
    setScore(state.score);
    setCoins(state.coins);
    setDistance(state.distance);
    setSpeed(state.speed);
    setWaveOffset(state.waveOffset);
    setBubbles([...state.bubbles]);
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
    onArrowDown: () => engine.duck(),
    onA: () => engine.moveLeft(),
    onD: () => engine.moveRight(),
    onW: () => engine.jump(),
    onS: () => engine.duck(),
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
    setWaveOffset(state.waveOffset);
    setBubbles([...state.bubbles]);
    setIsGameOver(false);
    onScoreUpdate(state.score);
  }, [engine, onScoreUpdate]);

  const getObstacleIcon = (type: Obstacle['type']) => {
    switch (type) {
      case 'coin': return '🪙';
      case 'powerup': return '🚀';
      case 'rock': return '🪨';
      case 'log': return '🪵';
      case 'tornado': return '🌪️';
      default: return '🪙';
    }
  };

  const getObstacleStyle = (type: Obstacle['type']) => {
    switch (type) {
      case 'coin':
        return { backgroundColor: 'transparent', boxShadow: 'none' };
      case 'powerup':
        return { backgroundColor: 'transparent', boxShadow: `0 0 25px ${NEON_COLORS.neonPink}` };
      case 'rock':
        return { backgroundColor: '#7f8c8d', boxShadow: `0 0 10px #7f8c8d80` };
      case 'log':
        return { backgroundColor: '#8B4513', boxShadow: `0 0 10px #8B451380` };
      default:
        return { backgroundColor: 'transparent', boxShadow: `0 0 15px ${NEON_COLORS.neonCyan}` };
    }
  };

  const renderObstacle = (obs: Obstacle, index: number) => (
    <motion.div
      key={`obs-${index}`}
      className="absolute flex items-center justify-center rounded-lg text-2xl"
      style={{
        left: obs.x,
        top: obs.y,
        width: obs.width,
        height: obs.height,
        ...getObstacleStyle(obs)
      }}
      animate={
        obs.type === 'coin' ? { rotate: 360, scale: [1, 1.15, 1] } :
        obs.type === 'tornado' ? { rotate: 360, scale: [0.9, 1.1, 0.9] } :
        obs.type === 'powerup' ? { scale: [1, 1.2, 1], y: [obs.y, obs.y - 5, obs.y] } :
        {}
      }
      transition={
        obs.type === 'coin' ? { duration: 1, repeat: Infinity, ease: 'linear' } :
        obs.type === 'tornado' ? { duration: 0.3, repeat: Infinity } :
        obs.type === 'powerup' ? { duration: 0.5, repeat: Infinity } :
        {}
      }
    >
      {getObstacleIcon(obs.type)}
    </motion.div>
  );

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
          <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{Math.floor(distance)}m</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.bestScore}m</div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center gap-1">
          <span className="text-xl">🪙</span>
          <span className="font-bold" style={{ color: NEON_COLORS.gold }}>{coins}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm" style={{ color: NEON_COLORS.gold }}>速度</span>
          <span className="font-bold" style={{ color: NEON_COLORS.neonBlue }}>{speed.toFixed(1)}x</span>
        </div>
        {player.boostActive && (
          <div className="flex items-center gap-1">
            <span style={{ color: NEON_COLORS.neonPink }}>🚀</span>
          </div>
        )}
      </div>

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          background: `linear-gradient(180deg, #87CEEB 0%, #00BFFF 20%, #1E90FF 50%, #4169E1 80%, #1E90FF 100%)`,
          boxShadow: `0 0 30px ${NEON_COLORS.neonBlue}30`,
          border: `2px solid ${NEON_COLORS.neonBlue}40`
        }}
      >
        {bubbles.map((bubble, i) => (
          <motion.div
            key={`bubble-${i}`}
            className="absolute rounded-full"
            style={{
              left: bubble.x,
              top: bubble.y,
              width: bubble.size,
              height: bubble.size,
              backgroundColor: NEON_COLORS.white,
              opacity: bubble.opacity
            }}
            animate={{ y: bubble.y - 5, scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        ))}

        <svg
          className="absolute bottom-0 left-0 right-0"
          style={{ height: 150 }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#4169E1', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#1E90FF', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <path
            d={`M 0 50 ${Array.from({ length: 20 }, (_, i) =>
              `Q ${i * 40 + 20} ${50 + Math.sin((i + waveOffset * 0.1) * 0.5) * 15} ${i * 40 + 40} 50`
            ).join(' ')} L 800 150 L 0 150 Z`}
            fill="url(#waterGradient)"
          />
          <path
            d={`M 0 30 ${Array.from({ length: 20 }, (_, i) =>
              `Q ${i * 40 + 20} ${30 + Math.sin((i + waveOffset * 0.15) * 0.6) * 10} ${i * 40 + 40} 30`
            ).join(' ')} L 800 100 L 0 100 Z`}
            fill="#87CEEB"
            opacity="0.5"
          />
        </svg>

        <div
          className="absolute bottom-0 left-0 right-0 h-2 opacity-60"
          style={{
            background: `linear-gradient(90deg, #87CEEB 0%, ${NEON_COLORS.white} 50%, #87CEEB 100%)`
          }}
        />

        {obstacles.map((obs, i) => renderObstacle(obs, i))}

        <motion.div
          className="absolute"
          style={{
            left: player.x,
            top: player.y,
            width: PLAYER_SIZE,
            height: player.isDucking ? PLAYER_SIZE - 20 : PLAYER_SIZE
          }}
          animate={{ y: player.y }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div
            className="w-full h-full rounded-xl flex items-center justify-center text-3xl"
            style={{
              background: player.boostActive
                ? `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.gold})`
                : `linear-gradient(135deg, ${NEON_COLORS.neonBlue}, #87CEEB)`,
              boxShadow: player.boostActive
                ? `0 0 40px ${NEON_COLORS.neonPink}`
                : `0 0 25px ${NEON_COLORS.neonBlue}60`,
              transform: player.isDucking ? 'scaleY(0.7) translateY(15%)' : 'none'
            }}
          >
            🚣
          </div>
        </motion.div>

        {isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(30, 144, 255, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.white }}>
              💦 撞到了!
            </div>
            <div className="text-2xl mb-2" style={{ color: NEON_COLORS.gold }}>
              距离: {Math.floor(distance)}m
            </div>
            <div className="text-lg mb-6" style={{ color: NEON_COLORS.white }}>
              🪙 {coins}
            </div>
            <div className="flex gap-4">
              <motion.button
                onClick={handleRestart}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: NEON_COLORS.neonBlue,
                  color: NEON_COLORS.white,
                  boxShadow: `0 0 20px ${NEON_COLORS.neonBlue}`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                再来一次
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
              backgroundColor: NEON_COLORS.neonBlue,
              color: NEON_COLORS.white,
              boxShadow: `0 0 15px ${NEON_COLORS.neonBlue}60`
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            ↑
          </motion.button>
          <motion.button
            onClick={() => engine.duck()}
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{
              backgroundColor: NEON_COLORS.neonBlue,
              color: NEON_COLORS.white,
              boxShadow: `0 0 15px ${NEON_COLORS.neonBlue}60`
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
        <div>← → 换道 | ↑ 跳 | ↓ 下潜</div>
        <div>收集🪙和🚀加速,躲避障碍!</div>
      </div>
    </div>
  );
}
