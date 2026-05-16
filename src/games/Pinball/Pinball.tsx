import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, PINBALL_CONSTANTS } from '../../utils/constants';
import { PinballEngine, PinballState } from './engine';

const { CANVAS_WIDTH, CANVAS_HEIGHT } = PINBALL_CONSTANTS;

type GameStatus = 'idle' | 'playing' | 'gameover';

export default function Pinball() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PinballEngine | null>(null);
  const animFrameRef = useRef<number>(0);

  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useLocalStorage<number>(STORAGE_KEYS.PINBALL, 0);

  const navigate = useNavigate();

  useEffect(() => {
    engineRef.current = new PinballEngine();
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, state: PinballState) => {
    const { ball, leftFlipper, rightFlipper, launcher, bumpers, walls } = state;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const bgGrad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#0f0f1a');
    bgGrad.addColorStop(0.5, '#1a1a2e');
    bgGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(108, 92, 231, 0.4)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (const wall of walls) {
      ctx.beginPath();
      ctx.moveTo(wall.x1, wall.y1);
      ctx.lineTo(wall.x2, wall.y2);
      ctx.stroke();
    }

    for (const bumper of bumpers) {
      const isHit = bumper.hitTimer > 0;
      const glowSize = isHit ? bumper.radius + 10 : bumper.radius + 4;

      const glowGrad = ctx.createRadialGradient(
        bumper.x, bumper.y, bumper.radius * 0.3,
        bumper.x, bumper.y, glowSize
      );
      glowGrad.addColorStop(0, isHit ? '#ffffff' : bumper.color);
      glowGrad.addColorStop(0.6, bumper.color + '80');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(bumper.x, bumper.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isHit ? '#ffffff' : bumper.color;
      ctx.beginPath();
      ctx.arc(bumper.x, bumper.y, bumper.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bumper.x, bumper.y, bumper.radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(108, 92, 231, 0.15)';
    ctx.fillRect(launcher.x - launcher.width / 2, launcher.y, launcher.width, launcher.height);

    if (state.isLaunching) {
      const springY = launcher.y + launcher.height - 20;
      const compression = launcher.power / launcher.maxPower;
      const springHeight = 40 * (1 - compression * 0.6);

      ctx.fillStyle = `rgba(255, 107, 157, ${0.5 + compression * 0.5})`;
      ctx.fillRect(
        launcher.x - launcher.width / 2 + 3,
        springY + (40 - springHeight),
        launcher.width - 6,
        springHeight
      );

      if (launcher.isCharging) {
        ctx.fillStyle = '#ff6b9d';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${Math.round(compression * 100)}%`,
          launcher.x,
          launcher.y + launcher.height + 15
        );
      }
    }

    const drawFlipper = (
      flipper: typeof leftFlipper,
      color: string
    ) => {
      const tipX = flipper.x + Math.cos(flipper.angle) * flipper.length;
      const tipY = flipper.y + Math.sin(flipper.angle) * flipper.length;

      ctx.shadowColor = color;
      ctx.shadowBlur = flipper.isActive ? 20 : 8;

      ctx.strokeStyle = color;
      ctx.lineWidth = flipper.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(flipper.x, flipper.y);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(flipper.x, flipper.y, flipper.width / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    };

    drawFlipper(leftFlipper, '#ff6b9d');
    drawFlipper(rightFlipper, '#00d2ff');

    if (ball.active || state.isLaunching) {
      const ballGlow = ctx.createRadialGradient(
        ball.x, ball.y, 0,
        ball.x, ball.y, ball.radius * 3
      );
      ballGlow.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      ballGlow.addColorStop(0.3, 'rgba(0, 210, 255, 0.4)');
      ballGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = ballGlow;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius * 3, 0, Math.PI * 2);
      ctx.fill();

      const ballGrad = ctx.createRadialGradient(
        ball.x - ball.radius * 0.3,
        ball.y - ball.radius * 0.3,
        ball.radius * 0.1,
        ball.x,
        ball.y,
        ball.radius
      );
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(0.7, '#c0c0c0');
      ballGrad.addColorStop(1, '#808080');
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(ball.x - ball.radius * 0.25, ball.y - ball.radius * 0.25, ball.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    if (state.isLaunching) {
      ctx.fillText('SPACE 发射', CANVAS_WIDTH / 2, 30);
    }
  }, []);

  const gameLoop = useCallback(() => {
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    if (!engine || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (gameStatus === 'playing') {
      engine.tick();
      const state = engine.getState();

      setScore(state.score);
      setLives(state.lives);

      if (state.isGameOver) {
        setGameStatus('gameover');
        if (state.score > highScore) {
          setHighScore(state.score);
        }
      }

      draw(ctx, state);
    } else if (gameStatus === 'idle') {
      const state = engine.getState();
      draw(ctx, state);
    } else if (gameStatus === 'gameover') {
      const state = engine.getState();
      draw(ctx, state);
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameStatus, draw, highScore, setHighScore]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [gameLoop]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        engine.activateLeftFlipper();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        engine.activateRightFlipper();
      } else if (e.key === ' ') {
        e.preventDefault();
        engine.startChargingLauncher();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;

      if (e.key === 'ArrowLeft') {
        engine.deactivateLeftFlipper();
      } else if (e.key === 'ArrowRight') {
        engine.deactivateRightFlipper();
      } else if (e.key === ' ') {
        e.preventDefault();
        engine.releaseLauncher();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [gameStatus]);

  const handleStart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
      setScore(0);
      setLives(3);
      setGameStatus('playing');
    }
  }, []);

  const handleRestart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
      setScore(0);
      setLives(3);
      setGameStatus('playing');
    }
  }, []);

  const handleGoHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)'
      }}
    >
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center justify-between w-full" style={{ maxWidth: CANVAS_WIDTH }}>
          <motion.button
            onClick={handleGoHome}
            className="px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300"
            style={{
              backgroundColor: '#1a1a2e',
              color: '#00d2ff',
              boxShadow: '0 0 10px rgba(0, 210, 255, 0.4)'
            }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0, 210, 255, 0.8)' }}
            whileTap={{ scale: 0.95 }}
          >
            ← 返回
          </motion.button>

          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>
              当前分数
            </div>
            <motion.div
              className="text-3xl font-bold"
              style={{ color: '#ff6b9d' }}
              key={score}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.15 }}
            >
              {score}
            </motion.div>
          </div>

          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>
              最高分
            </div>
            <div className="text-2xl font-bold" style={{ color: '#00d2ff' }}>
              {highScore}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1" style={{ color: '#ffd700' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              className="text-xl transition-all duration-300"
              style={{ opacity: i < lives ? 1 : 0.2 }}
            >
              {i < lives ? '❤️' : '🖤'}
            </span>
          ))}
        </div>

        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(108, 92, 231, 0.3)',
            boxShadow: '0 0 30px rgba(255, 107, 157, 0.3), inset 0 0 50px rgba(0,0,0,0.5)'
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{ display: 'block' }}
          />

          <AnimatePresence>
            {gameStatus === 'idle' && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ backgroundColor: 'rgba(15, 15, 26, 0.85)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-5xl font-bold mb-3"
                  style={{
                    color: '#ff6b9d',
                    textShadow: '0 0 20px rgba(255, 107, 157, 0.8)'
                  }}
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  弹球台
                </motion.div>
                <motion.div
                  className="text-lg mb-8"
                  style={{ color: '#00d2ff' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Pinball
                </motion.div>

                <motion.button
                  onClick={handleStart}
                  className="px-8 py-3 rounded-xl font-bold text-lg mb-6"
                  style={{
                    background: 'linear-gradient(135deg, #ff6b9d, #a855f7)',
                    color: '#ffffff',
                    boxShadow: '0 0 25px rgba(255, 107, 157, 0.8)'
                  }}
                  whileHover={{ scale: 1.08, boxShadow: '0 0 40px rgba(255, 107, 157, 1)' }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  开始游戏
                </motion.button>

                <motion.div
                  className="text-sm opacity-60 text-center leading-6"
                  style={{ color: '#ffd700' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ delay: 0.7 }}
                >
                  <div>← → 控制挡板</div>
                  <div>空格键 发射弹球</div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {gameStatus === 'gameover' && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ backgroundColor: 'rgba(15, 15, 26, 0.9)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-4xl font-bold mb-4"
                  style={{
                    color: '#ff6b9d',
                    textShadow: '0 0 20px rgba(255, 107, 157, 0.8)'
                  }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                >
                  游戏结束
                </motion.div>

                <motion.div
                  className="text-2xl mb-2"
                  style={{ color: '#ffd700' }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  最终得分: {score}
                </motion.div>

                {score >= highScore && score > 0 && (
                  <motion.div
                    className="text-lg mb-4"
                    style={{ color: '#39ff14' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    🏆 新纪录!
                  </motion.div>
                )}

                <div className="flex gap-4 mt-4">
                  <motion.button
                    onClick={handleRestart}
                    className="px-6 py-3 rounded-lg font-bold"
                    style={{
                      backgroundColor: '#ff6b9d',
                      color: '#ffffff',
                      boxShadow: '0 0 20px rgba(255, 107, 157, 0.8)'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    再玩一次
                  </motion.button>
                  <motion.button
                    onClick={handleGoHome}
                    className="px-6 py-3 rounded-lg font-bold"
                    style={{
                      backgroundColor: '#1a1a2e',
                      color: '#00d2ff',
                      border: '2px solid #00d2ff'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    返回主页
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div
          className="glass-card rounded-xl px-6 py-4 text-center"
          style={{
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(108, 92, 231, 0.3)',
            maxWidth: CANVAS_WIDTH,
            width: '100%'
          }}
        >
          <div className="flex justify-center gap-8 text-sm" style={{ color: '#ffd700' }}>
            <div className="flex items-center gap-2">
              <kbd
                className="px-2 py-1 rounded text-xs font-mono"
                style={{
                  background: 'rgba(108, 92, 231, 0.3)',
                  color: '#ffffff',
                  border: '1px solid rgba(108, 92, 231, 0.5)'
                }}
              >
                ←
              </kbd>
              <kbd
                className="px-2 py-1 rounded text-xs font-mono"
                style={{
                  background: 'rgba(108, 92, 231, 0.3)',
                  color: '#ffffff',
                  border: '1px solid rgba(108, 92, 231, 0.5)'
                }}
              >
                →
              </kbd>
              <span>控制挡板</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd
                className="px-3 py-1 rounded text-xs font-mono"
                style={{
                  background: 'rgba(108, 92, 231, 0.3)',
                  color: '#ffffff',
                  border: '1px solid rgba(108, 92, 231, 0.5)'
                }}
              >
                Space
              </kbd>
              <span>发射弹球</span>
            </div>
          </div>
          <div className="mt-2 text-xs opacity-50" style={{ color: '#ffd700' }}>
            碰撞障碍物得 100 分 | 挡板弹起得 10 分 | 共 3 条命
          </div>
        </div>
      </div>
    </div>
  );
}