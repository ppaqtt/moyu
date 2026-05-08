import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { GameTempleRunEngine, Player, Obstacle } from './engine';

interface TempleRunProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const CANVAS_WIDTH = 240;
const CANVAS_HEIGHT = 600;
const LANE_POSITIONS = [-80, 0, 80];
const LANE_WIDTH = 80;
const PLAYER_Y = 400;

export default function TempleRun({ onScoreUpdate, onGameOver, onExit }: TempleRunProps) {
  const [engine] = useState(() => new GameTempleRunEngine());
  const [player, setPlayer] = useState<Player>(() => engine.getState().player);
  const [obstacles, setObstacles] = useState<Obstacle[]>(() => engine.getState().obstacles);
  const [score, setScore] = useState(() => engine.getState().score);
  const [coins, setCoins] = useState(() => engine.getState().coins);
  const [distance, setDistance] = useState(() => engine.getState().distance);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.TEMPLE_RUN);
  const keysPressed = useRef<Set<string>>(new Set());

  const handleTick = useCallback(() => {
    if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a') || keysPressed.current.has('A')) {
      engine.moveLeft();
    }
    if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d') || keysPressed.current.has('D')) {
      engine.moveRight();
    }
    if (keysPressed.current.has('ArrowUp') || keysPressed.current.has('w') || keysPressed.current.has('W')) {
      engine.jump();
    }
    if (keysPressed.current.has('ArrowDown') || keysPressed.current.has('s') || keysPressed.current.has('S')) {
      engine.slide();
    }

    engine.tick();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setObstacles([...state.obstacles]);
    setScore(state.score);
    setCoins(state.coins);
    setDistance(state.distance);
    setIsStarted(state.isStarted);
    onScoreUpdate(state.score);

    if (state.isGameOver && !isGameOver) {
      setIsGameOver(true);
      updateScore(state.score);
      onGameOver(state.score);
    }
  }, [engine, onScoreUpdate, onGameOver, updateScore, isGameOver]);

  useGameLoop({ callback: handleTick, delay: 16, enabled: true });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);
      if (!isStarted && !isGameOver && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        engine.start();
        setIsStarted(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine, isStarted, isGameOver]);

  const handleRestart = () => {
    engine.reset();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setObstacles([...state.obstacles]);
    setScore(state.score);
    setCoins(state.coins);
    setDistance(state.distance);
    setIsStarted(false);
    setIsGameOver(false);
    onScoreUpdate(0);
  };

  const renderTemple = () => (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute"
        style={{
          left: 0,
          right: 0,
          top: 0,
          height: 200,
          background: 'linear-gradient(180deg, #1a0a00 0%, #2d1810 100%)'
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="absolute bottom-0 w-8 bg-amber-900"
            style={{
              left: 20 + i * 60,
              height: 150 + Math.sin(i) * 30,
              boxShadow: '2px 0 4px rgba(0,0,0,0.5)'
            }}
          />
        ))}
      </div>

      <div
        className="absolute"
        style={{
          left: '50%',
          top: 100,
          transform: 'translateX(-50%)',
          width: CANVAS_WIDTH - 40,
          height: 300,
          background: 'linear-gradient(180deg, #3d2817 0%, #5c3d2e 100%)',
          borderLeft: '20px solid #4a3728',
          borderRight: '20px solid #4a3728'
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-1 bg-amber-800/50"
            style={{ top: 20 + i * 35 }}
          />
        ))}
      </div>
    </div>
  );

  const renderGround = () => (
    <div
      className="absolute bottom-0 left-0 right-0"
      style={{
        height: 200,
        background: 'linear-gradient(180deg, #8B7355 0%, #654321 50%, #3d2817 100%)'
      }}
    >
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute h-2 bg-amber-700"
          style={{
            left: (i * 60 - (engine as any).groundOffset) % 1200,
            top: 10 + (i % 3) * 20,
            width: 30
          }}
        />
      ))}

      <div className="absolute bottom-0 left-0 right-0 h-8 bg-stone-800" />
    </div>
  );

  const renderPlayer = () => {
    const slideHeight = player.isSliding ? 30 : 60;
    const y = player.isSliding ? PLAYER_Y + 30 : player.y;
    return (
      <motion.div
        className="absolute"
        style={{
          left: '50%',
          top: y,
          width: 40,
          height: slideHeight,
          marginLeft: LANE_POSITIONS[player.lane] - 20,
          marginTop: -slideHeight
        }}
        animate={{
          y: player.isJumping ? 0 : 0,
          scaleY: player.isSliding ? 0.5 : 1
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <svg viewBox="0 0 40 60" width="40" height={slideHeight}>
          <ellipse cx="20" cy="10" rx="10" ry="10" fill="#DEB887" />
          <circle cx="16" cy="8" r="2" fill="#333" />
          <circle cx="24" cy="8" r="2" fill="#333" />
          <rect x="12" y="20" width="16" height="25" rx="3" fill="#8B4513" />
          <rect x="8" y="22" width="6" height="15" rx="2" fill="#DEB887" />
          <rect x="26" y="22" width="6" height="15" rx="2" fill="#DEB887" />
          <rect x="12" y="45" width="7" height="15" rx="2" fill="#8B4513" />
          <rect x="21" y="45" width="7" height="15" rx="2" fill="#8B4513" />
        </svg>
      </motion.div>
    );
  };

  const renderObstacles = () => {
    return obstacles.map((obs, i) => {
      const screenX = '50%';
      const offsetX = LANE_POSITIONS[obs.lane];

      if (obs.type === 'low') {
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `calc(50% + ${offsetX}px)`,
              top: obs.y,
              width: 60,
              height: 30,
              marginLeft: -30,
              backgroundColor: '#4a3728',
              borderRadius: 5,
              boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
            }}
          />
        );
      } else if (obs.type === 'high') {
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `calc(50% + ${offsetX}px)`,
              top: obs.y - 100,
              width: 80,
              height: 60,
              marginLeft: -40,
              backgroundColor: '#3d2817',
              borderRadius: 10,
              boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
            }}
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[20px] border-b-red-600" />
          </div>
        );
      } else {
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `calc(50% + ${offsetX}px)`,
              top: obs.y,
              width: 30,
              height: 30,
              marginLeft: -15
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <span className="text-3xl">🪙</span>
          </motion.div>
        );
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[280px] px-4">
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

        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>距离</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{Math.floor(distance)}m</div>
          </div>

          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>金币</div>
            <div className="text-xl">🪙 {coins}</div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.bestScore}</div>
        </div>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          backgroundColor: '#1a0a00',
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
          border: `2px solid ${NEON_COLORS.neonPink}40`
        }}
      >
        {renderTemple()}
        {renderGround()}
        {renderObstacles()}
        {renderPlayer()}

        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-8 text-sm font-bold" style={{ color: NEON_COLORS.gold }}>
          <span>← → 换道</span>
          <span>↑ 跳</span>
          <span>↓ 滑</span>
        </div>

        {!isStarted && !isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(26, 10, 0, 0.9)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-5xl mb-4">🏛️</div>
            <div className="text-3xl font-bold mb-2" style={{ color: NEON_COLORS.neonPink }}>
              神庙逃亡
            </div>
            <div className="text-lg mb-4" style={{ color: NEON_COLORS.gold }}>
              Temple Run
            </div>
            <motion.button
              onClick={() => {
                engine.start();
                setIsStarted(true);
              }}
              className="px-8 py-4 rounded-xl text-xl font-bold"
              style={{
                backgroundColor: NEON_COLORS.neonPink,
                color: NEON_COLORS.white,
                boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              开始逃亡
            </motion.button>
          </motion.div>
        )}

        {isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(26, 10, 0, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-5xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
              💀 被抓到了!
            </div>
            <div className="text-2xl mb-2" style={{ color: NEON_COLORS.gold }}>
              距离: {Math.floor(distance)}m
            </div>
            <div className="text-lg mb-6" style={{ color: NEON_COLORS.neonBlue }}>
              最高: {record.bestScore}
            </div>
            <motion.button
              onClick={handleRestart}
              className="px-8 py-4 rounded-xl text-xl font-bold"
              style={{
                backgroundColor: NEON_COLORS.neonPink,
                color: NEON_COLORS.white,
                boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              再来一局
            </motion.button>
          </motion.div>
        )}
      </div>

      <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.gold }}>
        <div>← → 换道躲避障碍</div>
        <div>↑ 跳过低矮障碍，↓ 滑过低空障碍</div>
      </div>
    </div>
  );
}
