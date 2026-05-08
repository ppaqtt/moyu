import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { GameStickmanEngine, Stickman, Hook, Obstacle } from './engine';

interface StickmanHookProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

export default function StickmanHook({ onScoreUpdate, onGameOver, onExit }: StickmanHookProps) {
  const [engine] = useState(() => new GameStickmanEngine());
  const [stickman, setStickman] = useState<Stickman>(() => engine.getState().stickman);
  const [hooks, setHooks] = useState<Hook[]>(() => engine.getState().hooks);
  const [obstacles, setObstacles] = useState<Obstacle[]>(() => engine.getState().obstacles);
  const [score, setScore] = useState(() => engine.getState().score);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.STICKMAN_HOOK);
  const cameraX = engine.getCameraX();

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setStickman({ ...state.stickman });
    setHooks([...state.hooks]);
    setObstacles([...state.obstacles]);
    setScore(state.score);
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
      if (e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isStarted) {
          engine.start();
          setIsStarted(true);
        }
        engine.grapple();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        engine.release();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine, isStarted]);

  const handleRestart = () => {
    engine.reset();
    const state = engine.getState();
    setStickman({ ...state.stickman });
    setHooks([...state.hooks]);
    setObstacles([...state.obstacles]);
    setScore(state.score);
    setIsStarted(false);
    setIsGameOver(false);
    onScoreUpdate(0);
  };

  const renderStickman = () => {
    const screenX = stickman.x - cameraX;
    return (
      <motion.div
        className="absolute"
        style={{
          left: screenX,
          top: stickman.y,
          transformOrigin: 'center center'
        }}
        animate={{ rotate: stickman.rotation }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="10" r="8" fill={NEON_COLORS.neonPink} />
          <line x1="20" y1="18" x2="20" y2="30" stroke={NEON_COLORS.neonPink} strokeWidth="3" />
          <line x1="20" y1="22" x2="10" y2="28" stroke={NEON_COLORS.neonPink} strokeWidth="3" />
          <line x1="20" y1="22" x2="30" y2="28" stroke={NEON_COLORS.neonPink} strokeWidth="3" />
          <line x1="20" y1="30" x2="12" y2="38" stroke={NEON_COLORS.neonPink} strokeWidth="3" />
          <line x1="20" y1="30" x2="28" y2="38" stroke={NEON_COLORS.neonPink} strokeWidth="3" />
        </svg>
      </motion.div>
    );
  };

  const renderRope = () => {
    if (!stickman.isGrappling) return null;
    const screenX = stickman.x - cameraX;
    const ropeEndScreenX = stickman.ropeEndX - cameraX;
    return (
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10 }}
      >
        <line
          x1={screenX}
          y1={stickman.y}
          x2={ropeEndScreenX}
          y2={stickman.ropeEndY}
          stroke={NEON_COLORS.gold}
          strokeWidth="3"
          strokeDasharray="5,5"
        />
      </svg>
    );
  };

  const renderHooks = () => {
    return hooks.map((hook, i) => {
      const screenX = hook.x - cameraX;
      if (screenX < -50 || screenX > CANVAS_WIDTH + 50) return null;
      return (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: screenX - 15,
            top: hook.y - 15,
          }}
          animate={{ y: [hook.y, hook.y - 5, hook.y] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <svg width="30" height="30" viewBox="0 0 30 30">
            <circle cx="15" cy="15" r="12" fill="none" stroke={NEON_COLORS.neonBlue} strokeWidth="3" />
            <circle cx="15" cy="15" r="5" fill={NEON_COLORS.neonBlue} />
          </svg>
        </motion.div>
      );
    });
  };

  const renderObstacles = () => {
    return obstacles.map((obs, i) => {
      const screenX = obs.x - cameraX;
      if (screenX < -100 || screenX > CANVAS_WIDTH + 100) return null;
      return (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: screenX - obs.width / 2,
            top: obs.y - obs.height / 2,
            width: obs.width,
            height: obs.height,
            backgroundColor: obs.rotation === 0 ? '#FF6B6B' : '#4ECDC4',
            borderRadius: 10,
            boxShadow: `0 0 15px ${obs.rotation === 0 ? '#FF6B6B' : '#4ECDC4'}`
          }}
        />
      );
    });
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

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>距离</div>
          <div className="text-3xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{score}m</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.bestScore}m</div>
        </div>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
          border: `2px solid ${NEON_COLORS.neonPink}40`
        }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute bottom-0 left-0 right-0 h-4"
            style={{ backgroundColor: '#2ECC71' }}
          />

          {renderHooks()}
          {renderObstacles()}
          {renderRope()}
          {renderStickman()}
        </div>

        <div className="absolute top-4 left-4 text-sm font-bold" style={{ color: NEON_COLORS.neonBlue }}>
          按住空格/W/上键 抓住钩子
        </div>

        {!isStarted && !isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.9)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-5xl mb-4">🦸</div>
            <div className="text-3xl font-bold mb-2" style={{ color: NEON_COLORS.neonPink }}>
              Stickman Hook
            </div>
            <div className="text-xl mb-4" style={{ color: NEON_COLORS.gold }}>
              抓住钩子摆动前进!
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
              开始游戏
            </motion.button>
          </motion.div>
        )}

        {isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-5xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
              💥 撞到了!
            </div>
            <div className="text-3xl mb-2" style={{ color: NEON_COLORS.gold }}>
              距离: {score}m
            </div>
            <div className="text-xl mb-6" style={{ color: NEON_COLORS.neonBlue }}>
              最高: {record.bestScore}m
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
        <div>按住空格/W/上键抓住钩子，松手释放</div>
        <div>摆动积累速度，飞向下一个钩子</div>
      </div>
    </div>
  );
}
