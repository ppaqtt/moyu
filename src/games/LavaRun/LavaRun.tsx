import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { LavaRunEngine, Obstacle, Platform } from './engine';

interface LavaRunProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const LANE_WIDTH = 80;
const LANES = 3;
const CANVAS_WIDTH = LANE_WIDTH * LANES;
const CANVAS_HEIGHT = 500;
const PLAYER_SIZE = 50;

export default function LavaRun({ onScoreUpdate, onGameOver, onExit }: LavaRunProps) {
  const [engine] = useState(() => new LavaRunEngine());
  const [player, setPlayer] = useState(() => engine.getState().player);
  const [platforms, setPlatforms] = useState<Platform[]>(() => engine.getState().platforms);
  const [obstacles, setObstacles] = useState<Obstacle[]>(() => engine.getState().obstacles);
  const [score, setScore] = useState(() => engine.getState().score);
  const [gems, setGems] = useState(() => engine.getState().gems);
  const [distance, setDistance] = useState(() => engine.getState().distance);
  const [speed, setSpeed] = useState(() => engine.getState().speed);
  const [lavaLevel, setLavaLevel] = useState(() => engine.getState().lavaLevel);
  const [isGameOver, setIsGameOver] = useState(false);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.LAVA_RUN);

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setPlatforms([...state.platforms]);
    setObstacles([...state.obstacles]);
    setScore(state.score);
    setGems(state.gems);
    setDistance(state.distance);
    setSpeed(state.speed);
    setLavaLevel(state.lavaLevel);
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
    setPlatforms([...state.platforms]);
    setObstacles([...state.obstacles]);
    setScore(state.score);
    setGems(state.gems);
    setDistance(state.distance);
    setSpeed(state.speed);
    setLavaLevel(state.lavaLevel);
    setIsGameOver(false);
    onScoreUpdate(state.score);
  }, [engine, onScoreUpdate]);

  const getObstacleIcon = (type: Obstacle['type']) => {
    switch (type) {
      case 'gem': return '💎';
      case 'boost': return '🔥';
      case 'fire': return '🔥';
      case 'lava': return '🌋';
      default: return '💎';
    }
  };

  const getObstacleStyle = (type: Obstacle['type']) => {
    switch (type) {
      case 'gem':
        return { backgroundColor: 'transparent', boxShadow: `0 0 25px ${NEON_COLORS.neonCyan}` };
      case 'boost':
        return { backgroundColor: 'transparent', boxShadow: `0 0 25px #ff6b35` };
      case 'fire':
        return { backgroundColor: '#ff4500', boxShadow: `0 0 15px #ff4500` };
      default:
        return { backgroundColor: '#ff6b35', boxShadow: `0 0 15px #ff6b35` };
    }
  };

  const getPlatformStyle = (type: Platform['type']) => {
    switch (type) {
      case 'bouncy':
        return { backgroundColor: '#9b59b6', boxShadow: `0 0 15px #9b59b6` };
      case 'crumbling':
        return { backgroundColor: '#e67e22', boxShadow: `0 0 10px #e67e22` };
      default:
        return { backgroundColor: '#7f8c8d', boxShadow: `0 0 10px #7f8c8d` };
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
      animate={obs.type === 'gem' ? { rotate: 360, scale: [1, 1.15, 1] } : { scale: [1, 1.1, 1] }}
      transition={obs.type === 'gem'
        ? { duration: 1.5, repeat: Infinity, ease: 'linear' }
        : { duration: 0.6, repeat: Infinity }}
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
            color: '#ff6b35',
            boxShadow: `0 0 10px #ff6b3540`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>距离</div>
          <div className="text-2xl font-bold" style={{ color: '#ff6b35' }}>{Math.floor(distance)}m</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
          <div className="text-xl font-bold" style={{ color: '#ff6b35' }}>{record.bestScore}m</div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center gap-1">
          <span className="text-xl">💎</span>
          <span className="font-bold" style={{ color: NEON_COLORS.neonCyan }}>{gems}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm" style={{ color: NEON_COLORS.gold }}>速度</span>
          <span className="font-bold" style={{ color: '#ff6b35' }}>{speed.toFixed(1)}x</span>
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
          background: `linear-gradient(180deg, #1a0a0a 0%, #2d1810 40%, #4a1a0a 70%, #ff4500 100%)`,
          boxShadow: `0 0 30px #ff450030`,
          border: `2px solid #ff450060`
        }}
      >
        <motion.div
          className="absolute left-0 right-0 h-8"
          style={{
            top: lavaLevel,
            background: `linear-gradient(180deg, #ff4500 0%, #ff6b35 50%, #ffa500 100%)`,
            boxShadow: `0 0 40px #ff4500, 0 0 80px #ff6b35`
          }}
          animate={{ height: [32, 36, 32] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />

        <div
          className="absolute bottom-0 left-0 right-0 h-8"
          style={{
            background: `linear-gradient(180deg, #2d1810 0%, #4a1a0a 100%)`
          }}
        />

        {platforms.map((platform, i) => (
          <motion.div
            key={`platform-${i}`}
            className="absolute rounded-md"
            style={{
              left: platform.x,
              top: platform.y,
              width: platform.width,
              height: 20,
              ...getPlatformStyle(platform.type)
            }}
            animate={platform.type === 'bouncy' ? { scaleX: [1, 1.05, 1] } : {}}
            transition={platform.type === 'bouncy' ? { duration: 0.3, repeat: Infinity } : {}}
          />
        ))}

        {obstacles.map((obs, i) => renderObstacle(obs, i))}

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
              background: player.isShielded
                ? `linear-gradient(135deg, ${NEON_COLORS.neonGreen}, ${NEON_COLORS.neonCyan})`
                : `linear-gradient(135deg, #ff6b35, #ffa500)`,
              boxShadow: player.isShielded
                ? `0 0 30px ${NEON_COLORS.neonGreen}`
                : `0 0 30px #ff6b35`
            }}
          >
            🏃
          </div>
        </motion.div>

        {isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(26, 10, 10, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl font-bold mb-4" style={{ color: '#ff6b35' }}>
              🔥 熔岩吞噬!
            </div>
            <div className="text-2xl mb-2" style={{ color: NEON_COLORS.gold }}>
              距离: {Math.floor(distance)}m
            </div>
            <div className="text-lg mb-6" style={{ color: NEON_COLORS.neonCyan }}>
              💎 {gems}
            </div>
            <div className="flex gap-4">
              <motion.button
                onClick={handleRestart}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: '#ff6b35',
                  color: NEON_COLORS.white,
                  boxShadow: `0 0 20px #ff6b35`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                再试一次
              </motion.button>
              <motion.button
                onClick={onExit}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: NEON_COLORS.darkPurple,
                  color: '#ff6b35',
                  border: `2px solid #ff6b35`
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
            color: '#ff6b35',
            boxShadow: `0 0 15px #ff6b3540`,
            border: `2px solid #ff6b35`
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
            backgroundColor: '#ff6b35',
            color: NEON_COLORS.white,
            boxShadow: `0 0 15px #ff6b3560`
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
            color: '#ff6b35',
            boxShadow: `0 0 15px #ff6b3540`,
            border: `2px solid #ff6b35`
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          →
        </motion.button>
      </div>

      <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.gold }}>
        <div>← → 换道 | ↑ 跳</div>
        <div>躲避熔岩和火焰,收集💎宝石</div>
      </div>
    </div>
  );
}
