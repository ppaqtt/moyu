import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { GameFlappyEngine, Bird, Pipe } from './engine';

interface FlappyBirdProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const SKY_GRADIENT = 'linear-gradient(180deg, #87CEEB 0%, #E0F7FA 100%)';

export default function FlappyBird({ onScoreUpdate, onGameOver, onExit }: FlappyBirdProps) {
  const [engine] = useState(() => new GameFlappyEngine());
  const [bird, setBird] = useState<Bird>(() => engine.getState().bird);
  const [pipes, setPipes] = useState<Pipe[]>(() => engine.getState().pipes);
  const [score, setScore] = useState(() => engine.getState().score);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.FLAPPY_BIRD);
  const { width, height } = engine.getCanvasSize();
  const groundY = engine.getGroundY();
  const pipeWidth = engine.getPipeWidth();

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setBird({ ...state.bird });
    setPipes([...state.pipes]);
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
      if (e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        e.preventDefault();
        e.stopPropagation();
        engine.flap();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [engine]);

  const handleClick = () => {
    engine.flap();
  };

  const handleRestart = () => {
    engine.reset();
    const state = engine.getState();
    setBird({ ...state.bird });
    setPipes([...state.pipes]);
    setScore(state.score);
    setIsStarted(false);
    setIsGameOver(false);
    onScoreUpdate(0);
  };

  const renderBird = () => {
    return (
      <motion.div
        className="absolute"
        style={{
          left: bird.x - 20,
          top: bird.y - 20,
          width: 40,
          height: 40,
        }}
        animate={{ rotate: bird.rotation }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          }}
        >
          <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-white" />
          <div className="absolute top-4 left-5 w-2 h-2 rounded-full bg-black" />
          <div className="absolute top-4 right-0 w-4 h-3 bg-orange-600 rounded-full" 
               style={{ transform: 'rotate(-15deg)' }} />
        </div>
      </motion.div>
    );
  };

  const renderPipes = () => {
    return pipes.map((pipe, i) => (
      <React.Fragment key={i}>
        <div
          className="absolute w-full rounded-lg"
          style={{
            left: pipe.x,
            top: 0,
            width: pipeWidth,
            height: pipe.gapY,
            background: 'linear-gradient(90deg, #2ECC71 0%, #27AE60 100%)',
            boxShadow: 'inset 4px 0 0 rgba(255,255,255,0.3), inset -4px 0 0 rgba(0,0,0,0.2)',
            border: '3px solid #1E8449',
          }}
        />
        <div
          className="absolute w-full rounded-lg"
          style={{
            left: pipe.x,
            top: pipe.gapY + 150,
            width: pipeWidth,
            height: height - pipe.gapY - 150 - 80,
            background: 'linear-gradient(90deg, #2ECC71 0%, #27AE60 100%)',
            boxShadow: 'inset 4px 0 0 rgba(255,255,255,0.3), inset -4px 0 0 rgba(0,0,0,0.2)',
            border: '3px solid #1E8449',
          }}
        />
      </React.Fragment>
    ));
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[420px] px-4">
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
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>分数</div>
          <div className="text-3xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{score}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.bestScore}</div>
        </div>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden cursor-pointer select-none"
        style={{
          width: width,
          height: height,
          background: SKY_GRADIENT,
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
          border: `2px solid ${NEON_COLORS.neonPink}40`
        }}
        onClick={handleClick}
      >
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-5xl font-bold"
             style={{ 
               color: NEON_COLORS.white, 
               textShadow: '2px 2px 4px rgba(0,0,0,0.5)' 
             }}>
          {score}
        </div>

        {renderPipes()}
        {renderBird()}

        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: 80,
            background: 'linear-gradient(180deg, #8B4513 0%, #654321 100%)',
            borderTop: '4px solid #5D3A1A'
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-4 bg-green-600" />
        </div>

        {!isStarted && !isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl mb-4">🐦</div>
            <div className="text-2xl font-bold mb-2" style={{ color: NEON_COLORS.white }}>
              Flappy Bird
            </div>
            <div className="text-lg" style={{ color: NEON_COLORS.gold }}>
              点击或按空格开始
            </div>
          </motion.div>
        )}

        {isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.9)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-5xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
              游戏结束
            </div>
            <div className="text-3xl mb-2" style={{ color: NEON_COLORS.gold }}>
              得分: {score}
            </div>
            <div className="text-xl mb-6" style={{ color: NEON_COLORS.neonBlue }}>
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
        <div>点击屏幕或按空格键让小鸟飞翔</div>
        <div>穿过管道得分，撞到管道或地面则游戏结束</div>
      </div>
    </div>
  );
}
