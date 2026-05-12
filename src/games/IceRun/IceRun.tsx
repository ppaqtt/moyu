import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { IceRunEngine, Obstacle } from './engine';

interface IceRunProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const LANE_WIDTH = 80;
const LANES = 3;
const CANVAS_WIDTH = LANE_WIDTH * LANES;
const CANVAS_HEIGHT = 500;
const PLAYER_SIZE = 55;

export default function IceRun({ onScoreUpdate, onGameOver, onExit }: IceRunProps) {
  const [engine] = useState(() => new IceRunEngine());
  const [player, setPlayer] = useState(() => engine.getState().player);
  const [obstacles, setObstacles] = useState<Obstacle[]>(() => engine.getState().obstacles);
  const [score, setScore] = useState(() => engine.getState().score);
  const [fish, setFish] = useState(() => engine.getState().fish);
  const [distance, setDistance] = useState(() => engine.getState().distance);
  const [speed, setSpeed] = useState(() => engine.getState().speed);
  const [snowflakes, setSnowflakes] = useState(() => engine.getState().snowflakes);
  const [isGameOver, setIsGameOver] = useState(false);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.ICE_RUN);

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setObstacles([...state.obstacles]);
    setScore(state.score);
    setFish(state.fish);
    setDistance(state.distance);
    setSpeed(state.speed);
    setSnowflakes([...state.snowflakes]);
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
    setFish(state.fish);
    setDistance(state.distance);
    setSpeed(state.speed);
    setSnowflakes([...state.snowflakes]);
    setIsGameOver(false);
    onScoreUpdate(state.score);
  }, [engine, onScoreUpdate]);

  const getObstacleIcon = (type: Obstacle['type']) => {
    switch (type) {
      case 'fish': return '🐟';
      case 'iceCream': return '🍦';
      case 'penguin': return '🐧';
      case 'snowball': return '❄️';
      case 'ice': return '🧊';
      default: return '🐟';
    }
  };

  const getObstacleStyle = (type: Obstacle['type']) => {
    switch (type) {
      case 'fish':
        return { backgroundColor: 'transparent', boxShadow: 'none' };
      case 'iceCream':
        return { backgroundColor: 'transparent', boxShadow: `0 0 20px ${NEON_COLORS.neonPink}` };
      case 'penguin':
        return { backgroundColor: '#1a1a2e', boxShadow: `0 0 10px ${NEON_COLORS.white}40` };
      case 'snowball':
        return { backgroundColor: NEON_COLORS.white, boxShadow: `0 0 15px ${NEON_COLORS.white}80` };
      default:
        return { backgroundColor: '#87CEEB', boxShadow: `0 0 10px #87CEEB` };
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
        obs.type === 'fish' ? { rotate: [-10, 10, -10], scale: [1, 1.1, 1] } :
        obs.type === 'snowball' ? { scale: [0.9, 1.1, 0.9] } :
        { scale: [1, 1.05, 1] }
      }
      transition={
        obs.type === 'fish' ? { duration: 0.5, repeat: Infinity } :
        obs.type === 'snowball' ? { duration: 0.3, repeat: Infinity } :
        { duration: 0.4, repeat: Infinity }
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
            color: '#00d2ff',
            boxShadow: `0 0 10px #00d2ff40`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>距离</div>
          <div className="text-2xl font-bold" style={{ color: '#00d2ff' }}>{Math.floor(distance)}m</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
          <div className="text-xl font-bold" style={{ color: '#00d2ff' }}>{record.bestScore}m</div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center gap-1">
          <span className="text-xl">🐟</span>
          <span className="font-bold" style={{ color: NEON_COLORS.neonCyan }}>{fish}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm" style={{ color: NEON_COLORS.gold }}>速度</span>
          <span className="font-bold" style={{ color: '#00d2ff' }}>{speed.toFixed(1)}x</span>
        </div>
        {player.isShielded && (
          <div className="flex items-center gap-1">
            <span style={{ color: NEON_COLORS.neonGreen }}>🛡️</span>
          </div>
        )}
      </div>

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          background: `linear-gradient(180deg, #e8f4f8 0%, #b8d4e3 30%, #87CEEB 60%, #b8d4e3 100%)`,
          boxShadow: `0 0 30px #00d2ff30`,
          border: `2px solid #00d2ff40`
        }}
      >
        {snowflakes.map((flake, i) => (
          <motion.div
            key={`flake-${i}`}
            className="absolute rounded-full"
            style={{
              left: flake.x,
              top: flake.y,
              width: flake.size,
              height: flake.size,
              backgroundColor: NEON_COLORS.white,
              opacity: flake.opacity
            }}
            animate={{
              y: flake.y + 10,
              x: flake.x + Math.sin(flake.x * 0.1) * 5
            }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          />
        ))}

        <div
          className="absolute bottom-0 left-0 right-0 h-12"
          style={{
            background: `linear-gradient(180deg, #b8d4e3 0%, #e8f4f8 50%, #ffffff 100%)`,
            boxShadow: `inset 0 5px 15px rgba(255,255,255,0.8)`
          }}
        />

        <div
          className="absolute bottom-10 left-0 right-0 h-1 opacity-30"
          style={{
            background: `repeating-linear-gradient(90deg, ${NEON_COLORS.white} 0px, ${NEON_COLORS.white} 20px, transparent 20px, transparent 40px)`
          }}
        />

        {obstacles.map((obs, i) => renderObstacle(obs, i))}

        <motion.div
          className="absolute"
          style={{
            left: player.x,
            top: player.y,
            width: PLAYER_SIZE,
            height: player.isSliding ? PLAYER_SIZE - 20 : PLAYER_SIZE
          }}
          animate={{ y: player.y }}
          transition={{ type: 'spring', stiffness: 150, damping: 15 }}
        >
          <div
            className="w-full h-full rounded-xl flex items-center justify-center text-3xl"
            style={{
              background: player.isShielded
                ? `linear-gradient(135deg, ${NEON_COLORS.neonGreen}, ${NEON_COLORS.neonCyan})`
                : `linear-gradient(135deg, #87CEEB, ${NEON_COLORS.white})`,
              boxShadow: player.isShielded
                ? `0 0 30px ${NEON_COLORS.neonGreen}`
                : `0 0 20px ${NEON_COLORS.neonCyan}60`,
              transform: player.isSliding ? 'rotate(-15deg) scaleY(0.6)' : 'none'
            }}
          >
            🏂
          </div>
        </motion.div>

        {isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(232, 244, 248, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl font-bold mb-4" style={{ color: '#00d2ff' }}>
              ❄️ 滑到了!
            </div>
            <div className="text-2xl mb-2" style={{ color: NEON_COLORS.gold }}>
              距离: {Math.floor(distance)}m
            </div>
            <div className="text-lg mb-6" style={{ color: NEON_COLORS.neonCyan }}>
              🐟 {fish}
            </div>
            <div className="flex gap-4">
              <motion.button
                onClick={handleRestart}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: '#00d2ff',
                  color: NEON_COLORS.white,
                  boxShadow: `0 0 20px #00d2ff`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                再滑一次
              </motion.button>
              <motion.button
                onClick={onExit}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: NEON_COLORS.darkPurple,
                  color: '#00d2ff',
                  border: `2px solid #00d2ff`
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
            color: '#00d2ff',
            boxShadow: `0 0 15px #00d2ff40`,
            border: `2px solid #00d2ff`
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
              backgroundColor: '#00d2ff',
              color: NEON_COLORS.white,
              boxShadow: `0 0 15px #00d2ff60`
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
              backgroundColor: '#00d2ff',
              color: NEON_COLORS.white,
              boxShadow: `0 0 15px #00d2ff60`
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
            color: '#00d2ff',
            boxShadow: `0 0 15px #00d2ff40`,
            border: `2px solid #00d2ff`
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          →
        </motion.button>
      </div>

      <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.gold }}>
        <div>← → 换道 | ↑ 跳 | ↓ 滑</div>
        <div>收集🐟和🍦,躲避障碍!</div>
      </div>
    </div>
  );
}
