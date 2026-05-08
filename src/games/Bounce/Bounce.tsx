import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { BOUNCE_CONSTANTS, STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { GameBounceEngine, Position, Brick } from './engine';

const { CANVAS_WIDTH, CANVAS_HEIGHT } = BOUNCE_CONSTANTS;

interface BounceProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

export default function Bounce({ onScoreUpdate, onGameOver, onExit }: BounceProps) {
  const [engine] = useState(() => new GameBounceEngine());
  const [ball, setBall] = useState(() => engine.getState().ball);
  const [paddle, setPaddle] = useState<Position>(() => engine.getState().paddle);
  const [bricks, setBricks] = useState<Brick[]>(() => engine.getState().bricks);
  const [score, setScore] = useState(() => engine.getState().score);
  const [level, setLevel] = useState(() => engine.getState().level);
  const [lives, setLives] = useState(() => engine.getState().lives);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.BOUNCE);

  const canvasRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);

  const handleTick = useCallback(() => {
    if (isPausedRef.current || isGameOver || isWon) return;

    const moved = engine.tick();
    const state = engine.getState();

    setBall({ ...state.ball });
    setPaddle({ ...state.paddle });
    setBricks([...state.bricks.map(b => ({ ...b }))]);
    setScore(state.score);
    setLevel(state.level);
    setLives(state.lives);
    onScoreUpdate(state.score);

    if (state.isGameOver) {
      setIsGameOver(true);
      updateScore(state.score);
      onGameOver(state.score);
    }
    if (state.isWon) {
      setIsWon(true);
    }
  }, [engine, onScoreUpdate, onGameOver, updateScore, isGameOver, isWon]);

  useGameLoop({ callback: handleTick, delay: 16, enabled: true });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isGameOver || isWon) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      engine.setPaddlePosition(x);
      setPaddle({ ...engine.getState().paddle });
    }
  }, [engine, isGameOver, isWon]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isGameOver || isWon) return;
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = touch.clientX - rect.left;
      engine.setPaddlePosition(x);
      setPaddle({ ...engine.getState().paddle });
    }
  }, [engine, isGameOver, isWon]);

  const handleRestart = useCallback(() => {
    engine.reset();
    const state = engine.getState();
    setBall({ ...state.ball });
    setPaddle({ ...state.paddle });
    setBricks([...state.bricks.map(b => ({ ...b }))]);
    setScore(state.score);
    setLevel(state.level);
    setLives(state.lives);
    setIsGameOver(false);
    setIsWon(false);
    onScoreUpdate(state.score);
  }, [engine, onScoreUpdate]);

  const handleNextLevel = useCallback(() => {
    engine.nextLevel();
    const state = engine.getState();
    setBall({ ...state.ball });
    setPaddle({ ...state.paddle });
    setBricks([...state.bricks.map(b => ({ ...b }))]);
    setScore(state.score);
    setLevel(state.level);
    setLives(state.lives);
    setIsWon(false);
    onScoreUpdate(state.score);
  }, [engine, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center justify-between w-full max-w-[480px] px-4">
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

      <div className="flex gap-4 mb-2" style={{ color: NEON_COLORS.gold }}>
        <div className="flex items-center gap-1">
          {Array(lives).fill(0).map((_, i) => (
            <span key={i} className="text-xl">❤️</span>
          ))}
          {Array(3 - lives).fill(0).map((_, i) => (
            <span key={i} className="text-xl opacity-30">🖤</span>
          ))}
        </div>
        <span>|</span>
        <span>等级: <span className="font-bold" style={{ color: NEON_COLORS.neonPink }}>{level}</span></span>
      </div>

      <div
        ref={canvasRef}
        className="relative rounded-2xl overflow-hidden cursor-none"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          backgroundColor: NEON_COLORS.darkPurple,
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30, inset 0 0 50px rgba(0,0,0,0.5)`,
          border: `2px solid ${NEON_COLORS.neonPink}40`
        }}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {bricks.filter(b => b.alive).map((brick, i) => (
          <motion.div
            key={i}
            className="absolute rounded-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.02 }}
            style={{
              left: brick.x,
              top: brick.y,
              width: brick.width,
              height: brick.height,
              backgroundColor: brick.color,
              boxShadow: `0 0 15px ${brick.color}80, inset 0 0 10px rgba(255,255,255,0.3)`
            }}
          />
        ))}

        <motion.div
          className="absolute rounded-full"
          animate={{
            x: ball.x - ball.radius,
            y: ball.y - ball.radius
          }}
          transition={{ type: 'tween', duration: 0.016 }}
          style={{
            width: ball.radius * 2,
            height: ball.radius * 2,
            backgroundColor: NEON_COLORS.white,
            boxShadow: `0 0 20px ${NEON_COLORS.white}, 0 0 40px ${NEON_COLORS.neonBlue}`,
            zIndex: 10
          }}
        />

        <div
          className="absolute rounded-lg transition-all duration-75"
          style={{
            left: paddle.x,
            top: paddle.y,
            width: BOUNCE_CONSTANTS.PADDLE_WIDTH,
            height: BOUNCE_CONSTANTS.PADDLE_HEIGHT,
            background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonBlue})`,
            boxShadow: `0 0 20px ${NEON_COLORS.neonPink}80`,
            zIndex: 10
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
            <div className="text-lg mb-6" style={{ color: NEON_COLORS.neonBlue }}>等级: {level}</div>
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

        {isWon && !isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonBlue }}>🎉 恭喜过关!</div>
            <div className="text-2xl mb-6" style={{ color: NEON_COLORS.gold }}>得分: {score}</div>
            <div className="flex gap-4">
              <motion.button
                onClick={handleNextLevel}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: NEON_COLORS.neonPink,
                  color: NEON_COLORS.white,
                  boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                下一关
              </motion.button>
              <motion.button
                onClick={handleRestart}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: NEON_COLORS.darkPurple,
                  color: NEON_COLORS.neonBlue,
                  border: `2px solid ${NEON_COLORS.neonBlue}`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                重新开始
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="text-center opacity-60" style={{ color: NEON_COLORS.gold }}>
        <div>移动鼠标或触摸控制球拍</div>
        <div className="text-sm mt-1">打掉所有砖块过关</div>
      </div>
    </div>
  );
}
