import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { GameHexGLEngine, Car, ObstacleHex } from './engine';

interface HexGLProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TRACK_WIDTH = 600;
const TRACK_CENTER_X = CANVAS_WIDTH / 2;

export default function HexGL({ onScoreUpdate, onGameOver, onExit }: HexGLProps) {
  const [engine] = useState(() => new GameHexGLEngine());
  const [car, setCar] = useState<Car>(() => engine.getState().car);
  const [obstacles, setObstacles] = useState<ObstacleHex[]>(() => engine.getState().obstacles);
  const [score, setScore] = useState(() => engine.getState().score);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.HEXGL);
  const keysPressed = useRef<Set<string>>(new Set());

  useEffect(() => {
    const gameLoop = () => {
      if (isStarted && !isGameOver) {
        if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a')) {
          engine.moveLeft();
        }
        if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d')) {
          engine.moveRight();
        }
        if (keysPressed.current.has('ArrowUp') || keysPressed.current.has('w')) {
          engine.boost();
        }
        if (keysPressed.current.has('ArrowDown') || keysPressed.current.has('s')) {
          engine.brake();
        }

        engine.tick();
        const state = engine.getState();
        setCar({ ...state.car });
        setObstacles([...state.obstacles]);
        setScore(state.score);
        onScoreUpdate(state.score);

        if (state.isGameOver && !isGameOver) {
          setIsGameOver(true);
          updateScore(state.score);
          onGameOver(state.score);
        }
      }
      requestAnimationFrame(gameLoop);
    };

    const animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [engine, isStarted, isGameOver, onScoreUpdate, onGameOver, updateScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);
      keysPressed.current.add(e.key.toLowerCase());
      if (!isStarted && !isGameOver && (e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault();
        engine.start();
        setIsStarted(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [engine, isStarted, isGameOver]);

  const handleRestart = () => {
    engine.reset();
    const state = engine.getState();
    setCar({ ...state.car });
    setObstacles([...state.obstacles]);
    setScore(state.score);
    setIsStarted(false);
    setIsGameOver(false);
    onScoreUpdate(0);
  };

  const renderTrack = () => {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute"
          style={{
            left: TRACK_CENTER_X - TRACK_WIDTH / 2,
            top: 0,
            bottom: 0,
            width: TRACK_WIDTH,
            background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 50%, #0a0a1a 100%)',
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)'
          }}
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 transform -translate-x-1/2"
              style={{
                top: (i * 60 + ((car.speed * 5) % 60)) % (CANVAS_HEIGHT + 100) - 50,
                width: 4,
                height: 40,
                backgroundColor: '#08d9d6',
                boxShadow: '0 0 10px #08d9d6'
              }}
            />
          ))}
        </div>

        <div
          className="absolute top-0 bottom-0"
          style={{
            left: TRACK_CENTER_X - TRACK_WIDTH / 2 - 5,
            width: 5,
            background: `repeating-linear-gradient(
              180deg,
              ${NEON_COLORS.neonPink} 0px,
              ${NEON_COLORS.neonPink} 30px,
              transparent 30px,
              transparent 60px
            )`,
            boxShadow: `0 0 10px ${NEON_COLORS.neonPink}`
          }}
        />
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: TRACK_CENTER_X + TRACK_WIDTH / 2,
            width: 5,
            background: `repeating-linear-gradient(
              180deg,
              ${NEON_COLORS.neonPink} 0px,
              ${NEON_COLORS.neonPink} 30px,
              transparent 30px,
              transparent 60px
            )`,
            boxShadow: `0 0 10px ${NEON_COLORS.neonPink}`
          }}
        />
      </div>
    );
  };

  const renderObstacles = () => {
    return obstacles.map((obs, i) => {
      return (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: obs.x - obs.size / 2,
            top: obs.y - obs.size / 2,
            width: obs.size,
            height: obs.size,
          }}
          animate={{ rotate: obs.rotation }}
        >
          <svg viewBox="0 0 100 100" width={obs.size} height={obs.size}>
            <polygon
              points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5"
              fill="none"
              stroke="#ff2e63"
              strokeWidth="4"
              style={{ filter: `drop-shadow(0 0 10px #ff2e63)` }}
            />
            <polygon
              points="50,20 78,35 78,65 50,80 22,65 22,35"
              fill="#ff2e6340"
              stroke="#ff2e63"
              strokeWidth="2"
            />
          </svg>
        </motion.div>
      );
    });
  };

  const renderCar = () => {
    const tilt = car.velocityX * 2;
    return (
      <motion.div
        className="absolute"
        style={{
          left: car.x - 20,
          top: car.y - 30,
          width: 40,
          height: 60,
        }}
        animate={{ rotate: tilt }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <svg viewBox="0 0 40 60" width="40" height="60">
          <defs>
            <linearGradient id="carBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#08d9d6" />
              <stop offset="50%" stopColor="#00ffff" />
              <stop offset="100%" stopColor="#08d9d6" />
            </linearGradient>
            <filter id="carGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <path
            d="M 5 55 L 10 20 L 15 5 L 25 5 L 30 20 L 35 55 Z"
            fill="url(#carBody)"
            filter="url(#carGlow)"
          />
          <rect x="12" y="10" width="16" height="8" rx="2" fill="#1a1a2e" opacity="0.7" />
          <circle cx="12" cy="52" r="4" fill="#333" />
          <circle cx="28" cy="52" r="4" fill="#333" />

          <ellipse cx="20" cy="0" rx="3" ry="6" fill={NEON_COLORS.neonBlue} opacity="0.6">
            <animate attributeName="opacity" values="0.6;0.3;0.6" dur="0.2s" repeatCount="Infinity" />
          </ellipse>
        </svg>
      </motion.div>
    );
  };

  const renderSpeedLines = () => {
    if (!isStarted) return null;
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 bg-white rounded-full"
            style={{
              left: `${10 + i * 9}%`,
              height: 30,
              top: -30
            }}
            animate={{
              y: [0, CANVAS_HEIGHT + 50],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              delay: i * 0.05
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[820px] px-4">
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

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>圈数</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{score}</div>
          </div>

          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>速度</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>
              {Math.floor(car.speed * 50)} km/h
            </div>
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
          backgroundColor: '#0a0a1a',
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
          border: `2px solid ${NEON_COLORS.neonPink}40`
        }}
      >
        {renderTrack()}
        {renderSpeedLines()}
        {renderObstacles()}
        {renderCar()}

        <div className="absolute top-4 left-4 text-xs font-mono" style={{ color: NEON_COLORS.neonBlue }}>
          <div>HEXGL RACER</div>
          <div className="opacity-60">v1.0</div>
        </div>

        {!isStarted && !isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(10, 10, 26, 0.9)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-6xl mb-4">🏎️</div>
            <div className="text-4xl font-bold mb-2" style={{ color: NEON_COLORS.neonPink }}>
              HEXGL
            </div>
            <div className="text-xl mb-4" style={{ color: NEON_COLORS.neonBlue }}>
              极速赛车
            </div>
            <motion.button
              onClick={() => {
                engine.start();
                setIsStarted(true);
              }}
              className="px-8 py-4 rounded-xl text-xl font-bold"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonBlue})`,
                color: NEON_COLORS.white,
                boxShadow: `0 0 30px ${NEON_COLORS.neonPink}`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              开始竞速
            </motion.button>
            <div className="mt-4 text-sm opacity-60" style={{ color: NEON_COLORS.gold }}>
              按空格或回车开始
            </div>
          </motion.div>
        )}

        {isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(10, 10, 26, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-5xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
              💥 撞毁!
            </div>
            <div className="text-3xl mb-2" style={{ color: NEON_COLORS.gold }}>
              完成圈数: {score}
            </div>
            <div className="text-xl mb-6" style={{ color: NEON_COLORS.neonBlue }}>
              最高: {record.bestScore}
            </div>
            <motion.button
              onClick={handleRestart}
              className="px-8 py-4 rounded-xl text-xl font-bold"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonBlue})`,
                color: NEON_COLORS.white,
                boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              重新挑战
            </motion.button>
          </motion.div>
        )}
      </div>

      <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.gold }}>
        <div>← → 或 A D 左右移动 | ↑ W 加速 | ↓ S 减速</div>
        <div>躲避六边形障碍物，尽可能完成更多圈!</div>
      </div>
    </div>
  );
}
