import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { SpaceEscapeEngine, Obstacle } from './engine';

interface SpaceEscapeProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const LANE_WIDTH = 80;
const LANES = 3;
const CANVAS_WIDTH = LANE_WIDTH * LANES;
const CANVAS_HEIGHT = 500;
const PLAYER_SIZE = 50;

export default function SpaceEscape({ onScoreUpdate, onGameOver, onExit }: SpaceEscapeProps) {
  const [engine] = useState(() => new SpaceEscapeEngine());
  const [player, setPlayer] = useState(() => engine.getState().player);
  const [obstacles, setObstacles] = useState<Obstacle[]>(() => engine.getState().obstacles);
  const [score, setScore] = useState(() => engine.getState().score);
  const [coins, setCoins] = useState(() => engine.getState().coins);
  const [distance, setDistance] = useState(() => engine.getState().distance);
  const [speed, setSpeed] = useState(() => engine.getState().speed);
  const [stars, setStars] = useState(() => engine.getState().stars);
  const [explosionParticles, setExplosionParticles] = useState(() => engine.getState().explosionParticles);
  const [isGameOver, setIsGameOver] = useState(false);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.SPACE_ESCAPE);

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setObstacles([...state.obstacles]);
    setScore(state.score);
    setCoins(state.coins);
    setDistance(state.distance);
    setSpeed(state.speed);
    setStars([...state.stars]);
    setExplosionParticles([...state.explosionParticles]);
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
    onA: () => engine.moveLeft(),
    onD: () => engine.moveRight(),
    onW: () => engine.jump(),
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
    setStars([...state.stars]);
    setExplosionParticles([...state.explosionParticles]);
    setIsGameOver(false);
    onScoreUpdate(state.score);
  }, [engine, onScoreUpdate]);

  const getObstacleIcon = (type: Obstacle['type']) => {
    switch (type) {
      case 'coin': return '🪙';
      case 'shield': return '🛡️';
      case 'asteroid': return '🪨';
      case 'debris': return '🔧';
      case 'laser': return '⚡';
      default: return '🪙';
    }
  };

  const getObstacleStyle = (type: Obstacle['type']) => {
    switch (type) {
      case 'coin':
        return { backgroundColor: 'transparent', boxShadow: 'none' };
      case 'shield':
        return { backgroundColor: 'transparent', boxShadow: `0 0 25px ${NEON_COLORS.neonGreen}` };
      case 'asteroid':
        return { backgroundColor: '#4a4a6a', boxShadow: `0 0 15px #4a4a6a80` };
      case 'debris':
        return { backgroundColor: '#6a6a8a', boxShadow: `0 0 10px #6a6a8a80` };
      default:
        return { backgroundColor: NEON_COLORS.neonPink, boxShadow: `0 0 20px ${NEON_COLORS.neonPink}` };
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
        ...getObstacleStyle(obs),
        transform: obs.rotation ? `rotate(${obs.rotation}deg)` : undefined
      }}
      animate={
        obs.type === 'coin' ? { rotate: 360, scale: [1, 1.15, 1] } :
        obs.type === 'shield' ? { scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] } :
        obs.type === 'asteroid' ? { rotate: (obs.rotation || 0) + 360 } :
        {}
      }
      transition={
        obs.type === 'coin' ? { duration: 1, repeat: Infinity, ease: 'linear' } :
        obs.type === 'shield' ? { duration: 0.5, repeat: Infinity } :
        obs.type === 'asteroid' ? { duration: 2, repeat: Infinity, ease: 'linear' } :
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
            color: NEON_COLORS.neonPurple,
            boxShadow: `0 0 10px ${NEON_COLORS.neonPurple}40`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>距离</div>
          <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPurple }}>{Math.floor(distance)}m</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonPurple }}>{record.bestScore}m</div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center gap-1">
          <span className="text-xl">🪙</span>
          <span className="font-bold" style={{ color: NEON_COLORS.gold }}>{coins}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm" style={{ color: NEON_COLORS.gold }}>速度</span>
          <span className="font-bold" style={{ color: NEON_COLORS.neonPurple }}>{speed.toFixed(1)}x</span>
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
          background: `linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 30%, #2a2a4e 60%, #1a1a2e 100%)`,
          boxShadow: `0 0 30px ${NEON_COLORS.neonPurple}30`,
          border: `2px solid ${NEON_COLORS.neonPurple}40`
        }}
      >
        {stars.map((star, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute rounded-full"
            style={{
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              backgroundColor: NEON_COLORS.white,
              opacity: star.opacity,
              boxShadow: `0 0 ${star.size * 2}px ${NEON_COLORS.white}`
            }}
            animate={{ y: star.y + 5, opacity: [star.opacity, star.opacity * 0.5, star.opacity] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        ))}

        <div
          className="absolute bottom-0 left-0 right-0 h-8"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${NEON_COLORS.neonPurple}30 100%)`
          }}
        />

        {obstacles.map((obs, i) => renderObstacle(obs, i))}

        {explosionParticles.map((particle, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full"
            style={{
              left: particle.x,
              top: particle.y,
              width: 6,
              height: 6,
              backgroundColor: particle.color,
              boxShadow: `0 0 10px ${particle.color}`,
              opacity: particle.life / 50
            }}
            animate={{
              x: particle.x + particle.vx,
              y: particle.y + particle.vy
            }}
            transition={{ duration: 0.1 }}
          />
        ))}

        <motion.div
          className="absolute"
          style={{
            left: player.x,
            top: player.y,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE
          }}
          animate={{ y: player.y }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div
            className="w-full h-full rounded-xl flex items-center justify-center text-3xl"
            style={{
              background: player.boostActive
                ? `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonPurple})`
                : `linear-gradient(135deg, ${NEON_COLORS.neonPurple}, #6366f1)`,
              boxShadow: player.boostActive
                ? `0 0 40px ${NEON_COLORS.neonPink}`
                : `0 0 25px ${NEON_COLORS.neonPurple}60`
            }}
          >
            🚀
          </div>
          {player.isShielded && (
            <motion.div
              className="absolute inset-0 rounded-xl border-4"
              style={{
                borderColor: NEON_COLORS.neonGreen,
                boxShadow: `0 0 20px ${NEON_COLORS.neonGreen}, inset 0 0 20px ${NEON_COLORS.neonGreen}40`
              }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          )}
        </motion.div>

        {isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(10, 10, 26, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonPurple }}>
              💥 飞船损毁!
            </div>
            <div className="text-2xl mb-2" style={{ color: NEON_COLORS.gold }}>
              距离: {Math.floor(distance)}m
            </div>
            <div className="text-lg mb-6" style={{ color: NEON_COLORS.neonPink }}>
              🪙 {coins}
            </div>
            <div className="flex gap-4">
              <motion.button
                onClick={handleRestart}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: NEON_COLORS.neonPurple,
                  color: NEON_COLORS.white,
                  boxShadow: `0 0 20px ${NEON_COLORS.neonPurple}`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                重新发射
              </motion.button>
              <motion.button
                onClick={onExit}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: NEON_COLORS.darkPurple,
                  color: NEON_COLORS.neonPurple,
                  border: `2px solid ${NEON_COLORS.neonPurple}`
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
            color: NEON_COLORS.neonPurple,
            boxShadow: `0 0 15px ${NEON_COLORS.neonPurple}40`,
            border: `2px solid ${NEON_COLORS.neonPurple}`
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          ←
        </motion.button>

        <motion.button
          onClick={() => engine.jump()}
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
          style={{
            backgroundColor: NEON_COLORS.neonPurple,
            color: NEON_COLORS.white,
            boxShadow: `0 0 15px ${NEON_COLORS.neonPurple}60`
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          ↑
        </motion.button>

        <motion.button
          onClick={() => engine.moveRight()}
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
          style={{
            backgroundColor: NEON_COLORS.darkPurple,
            color: NEON_COLORS.neonPurple,
            boxShadow: `0 0 15px ${NEON_COLORS.neonPurple}40`,
            border: `2px solid ${NEON_COLORS.neonPurple}`
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          →
        </motion.button>
      </div>

      <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.gold }}>
        <div>← → 移动 | ↑ 紧急升空</div>
        <div>收集🪙和🛡️,躲避陨石!</div>
      </div>
    </div>
  );
}
