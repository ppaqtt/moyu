import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { WHACK_A_MOLE_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { WhackAMoleEngine, Hole, HitEffect } from './engine';

const CANVAS_WIDTH = WHACK_A_MOLE_CONSTANTS.CANVAS_WIDTH;
const CANVAS_HEIGHT = WHACK_A_MOLE_CONSTANTS.CANVAS_HEIGHT;
const GRID_COLS = 3;
const GRID_ROWS = 3;
const HOLE_RADIUS = WHACK_A_MOLE_CONSTANTS.HOLE_SIZE / 2;
const MOLE_SIZE = WHACK_A_MOLE_CONSTANTS.MOLE_SIZE;

const GROUND_COLOR = '#5D4037';
const HOLE_COLOR = '#3E2723';
const MOLE_COLOR = '#8D6E63';
const MOLE_NOSE_COLOR = '#FF7043';
const MOLE_EYE_COLOR = '#1A1A1A';

export default function WhackAMole() {
  const navigate = useNavigate();
  const [engine] = useState(() => new WhackAMoleEngine());
  const [state, setState] = useState(() => engine.getState());
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [highScore, setHighScore] = useLocalStorage(STORAGE_KEYS.WHACK_A_MOLE, 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleScoreUpdate = useCallback((newScore: number) => {
  }, []);

  const handleGameOver = useCallback((finalScore: number) => {
  }, []);

  const drawHole = useCallback((ctx: CanvasRenderingContext2D, hole: Hole) => {
    const holeGradient = ctx.createRadialGradient(
      hole.x, hole.y, 0,
      hole.x, hole.y, HOLE_RADIUS
    );
    holeGradient.addColorStop(0, '#1A0F0A');
    holeGradient.addColorStop(0.7, HOLE_COLOR);
    holeGradient.addColorStop(1, '#2D1F15');

    ctx.beginPath();
    ctx.ellipse(hole.x, hole.y, HOLE_RADIUS, HOLE_RADIUS * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = holeGradient;
    ctx.fill();
    ctx.strokeStyle = '#4A3228';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, []);

  const drawMole = useCallback((ctx: CanvasRenderingContext2D, hole: Hole) => {
    if (hole.moleState === 'hidden') return;

    const moleX = hole.x;
    const moleY = hole.y + hole.moleY;

    const moleTop = moleY - MOLE_SIZE / 2;
    const visibleRatio = Math.max(0, Math.min(1, (moleY - (hole.y - HOLE_RADIUS * 0.3)) / (HOLE_RADIUS * 0.5)));

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(moleX, hole.y, HOLE_RADIUS - 5, HOLE_RADIUS * 0.3, 0, 0, Math.PI * 2);
    ctx.clip();

    const moleGradient = ctx.createRadialGradient(
      moleX - 10, moleTop + 10, 0,
      moleX, moleTop + MOLE_SIZE / 2, MOLE_SIZE
    );
    moleGradient.addColorStop(0, '#A1887F');
    moleGradient.addColorStop(0.5, MOLE_COLOR);
    moleGradient.addColorStop(1, '#5D4037');

    ctx.beginPath();
    ctx.ellipse(moleX, moleTop + MOLE_SIZE / 2, MOLE_SIZE / 2, MOLE_SIZE / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = moleGradient;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(moleX, moleTop + 15, 20, 15, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#BCAAA4';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(moleX - 8, moleTop + 12, 4, 0, Math.PI * 2);
    ctx.arc(moleX + 8, moleTop + 12, 4, 0, Math.PI * 2);
    ctx.fillStyle = MOLE_EYE_COLOR;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(moleX, moleTop + 22, 6, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = MOLE_NOSE_COLOR;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(moleX - 6, moleTop + 28, 4, 0, Math.PI * 2);
    ctx.arc(moleX + 6, moleTop + 28, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#FFAB91';
    ctx.fill();

    ctx.restore();
  }, []);

  const drawHitEffect = useCallback((ctx: CanvasRenderingContext2D, effect: HitEffect) => {
    const elapsed = Date.now() - effect.time;
    const progress = elapsed / 1000;

    if (progress < 1) {
      const alpha = 1 - progress;
      const scale = 1 + progress * 0.5;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${24 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 20;

      ctx.fillStyle = '#FFD700';
      ctx.fillText(`+${effect.score}`, effect.x, effect.y - 30 - progress * 30);

      if (effect.score > 10) {
        ctx.font = `bold ${16 * scale}px Arial`;
        ctx.fillStyle = '#FF6B6B';
        ctx.shadowColor = '#FF6B6B';
        ctx.fillText('COMBO!', effect.x, effect.y - 55 - progress * 30);
      }

      ctx.restore();
    }
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGradient.addColorStop(0, '#87CEEB');
    bgGradient.addColorStop(0.3, '#87CEEB');
    bgGradient.addColorStop(0.35, GROUND_COLOR);
    bgGradient.addColorStop(1, '#4E342E');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const grassLine = CANVAS_HEIGHT * 0.32;
    ctx.strokeStyle = '#6D4C41';
    ctx.lineWidth = 3;
    for (let i = 0; i < CANVAS_WIDTH; i += 15) {
      ctx.beginPath();
      ctx.moveTo(i, grassLine);
      ctx.lineTo(i + 5, grassLine - 8);
      ctx.stroke();
    }

    state.holes.forEach(hole => {
      drawHole(ctx, hole);
    });

    state.holes.forEach(hole => {
      drawMole(ctx, hole);
    });

    state.hitEffects.forEach(effect => {
      drawHitEffect(ctx, effect);
    });

    if (gameStatus === 'idle') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FF6B6B';
      ctx.shadowBlur = 20;
      ctx.fillText('🐹 打地鼠 🐹', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

      ctx.font = '24px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 10;
      ctx.fillText('点击开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }

    if (gameStatus === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FF6B6B';
      ctx.shadowColor = '#FF6B6B';
      ctx.shadowBlur = 20;
      ctx.fillText('⏰ 时间到! ⏰', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.fillText(`最终得分: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

      if (state.score > highScore) {
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#00FF88';
        ctx.shadowColor = '#00FF88';
        ctx.fillText('🎉 新纪录! 🎉', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45);
      }
    }
  }, [state, gameStatus, highScore, drawHole, drawMole, drawHitEffect]);

  useEffect(() => {
    if (gameStatus !== 'playing') {
      render();
      return;
    }

    const interval = setInterval(() => {
      engine.tick();
      setState({ ...engine.getState() });

      if (engine.checkGameOver()) {
        setGameStatus('gameover');
        if (state.score > highScore) {
          setHighScore(state.score);
        }
      }
    }, 16);

    const animationId = requestAnimationFrame(function animate() {
      render();
      if (gameStatus === 'playing') {
        requestAnimationFrame(animate);
      }
    });

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animationId);
    };
  }, [gameStatus, engine, render, state.score, highScore, setHighScore]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (gameStatus === 'idle') {
      setGameStatus('playing');
      return;
    }

    if (gameStatus === 'playing') {
      const hit = engine.handleClick(x, y);
      setState({ ...engine.getState() });
    }
  }, [gameStatus, engine]);

  const handleStart = useCallback(() => {
    engine.reset();
    setState({ ...engine.getState() });
    setGameStatus('playing');
  }, [engine]);

  const handleRestart = useCallback(() => {
    engine.reset();
    setState({ ...engine.getState() });
    setGameStatus('playing');
  }, [engine]);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div
      className="flex flex-col items-center gap-4 p-4 rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
        minHeight: '100vh'
      }}
    >
      <div className="flex items-center justify-between w-full max-w-[600px] px-4 pt-4">
        <motion.button
          onClick={handleBack}
          className="px-4 py-2 rounded-lg font-bold text-sm transition-all"
          style={{
            backgroundColor: 'rgba(26, 26, 46, 0.8)',
            color: '#00D2FF',
            boxShadow: '0 0 10px rgba(0, 210, 255, 0.3)',
            border: '1px solid rgba(0, 210, 255, 0.3)',
            backdropFilter: 'blur(10px)'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回主页
        </motion.button>

        <div className="flex items-center gap-6">
          <div
            className="px-4 py-2 rounded-lg text-center"
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 215, 0, 0.3)'
            }}
          >
            <div className="text-xs opacity-70" style={{ color: '#FFD700' }}>最高分</div>
            <div className="text-xl font-bold" style={{ color: '#FFD700' }}>{highScore}</div>
          </div>

          <div
            className="px-4 py-2 rounded-lg text-center"
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 107, 157, 0.3)'
            }}
          >
            <div className="text-xs opacity-70" style={{ color: '#FF6B9D' }}>当前得分</div>
            <div className="text-xl font-bold" style={{ color: '#FF6B9D' }}>{state.score}</div>
          </div>

          <div
            className="px-4 py-2 rounded-lg text-center"
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 210, 255, 0.3)'
            }}
          >
            <div className="text-xs opacity-70" style={{ color: '#00D2FF' }}>剩余时间</div>
            <div
              className="text-xl font-bold"
              style={{ color: state.timeLeft <= 10 ? '#FF4444' : '#00D2FF' }}
            >
              {state.timeLeft}s
            </div>
          </div>
        </div>
      </div>

      <motion.div
        className="relative rounded-2xl overflow-hidden"
        style={{
          boxShadow: '0 0 30px rgba(255, 107, 157, 0.3)',
          border: '2px solid rgba(255, 107, 157, 0.3)'
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          className="cursor-pointer"
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto'
          }}
        />

        <AnimatePresence>
          {gameStatus === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{
                backgroundColor: 'rgba(15, 15, 26, 0.9)',
                backdropFilter: 'blur(10px)'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-5xl mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                🐹
              </motion.div>

              <motion.h2
                className="text-4xl font-bold mb-2"
                style={{ color: '#FF6B9D' }}
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                游戏结束!
              </motion.h2>

              <motion.div
                className="text-3xl font-bold mb-4"
                style={{ color: '#FFD700' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                得分: {state.score}
              </motion.div>

              {state.score >= highScore && state.score > 0 && (
                <motion.div
                  className="text-xl font-bold mb-4"
                  style={{ color: '#00FF88' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  🎉 新纪录! 🎉
                </motion.div>
              )}

              <motion.div
                className="flex gap-4"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  onClick={handleRestart}
                  className="px-8 py-3 rounded-xl font-bold text-lg transition-all"
                  style={{
                    backgroundColor: '#FF6B9D',
                    color: '#FFFFFF',
                    boxShadow: '0 0 20px rgba(255, 107, 157, 0.5)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  再来一局
                </motion.button>

                <motion.button
                  onClick={handleBack}
                  className="px-8 py-3 rounded-xl font-bold text-lg transition-all"
                  style={{
                    backgroundColor: 'rgba(26, 26, 46, 0.8)',
                    color: '#00D2FF',
                    border: '2px solid #00D2FF',
                    backdropFilter: 'blur(10px)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  返回主页
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        className="mt-4 px-6 py-3 rounded-xl text-center"
        style={{
          backgroundColor: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(168, 85, 247, 0.3)'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="text-sm opacity-70" style={{ color: '#A855F7' }}>
          {gameStatus === 'idle' && '点击画布开始游戏'}
          {gameStatus === 'playing' && '连击加成: 每3次连击获得1.5倍分数!'}
          {gameStatus === 'gameover' && '按"再来一局"重新开始'}
        </div>
      </motion.div>

      {gameStatus === 'playing' && (
        <motion.div
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl"
          style={{
            backgroundColor: 'rgba(26, 26, 46, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(57, 255, 20, 0.3)'
          }}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-4">
            <div className="text-sm" style={{ color: '#39FF14' }}>
              连击: <span className="font-bold text-lg">{state.combo}</span>
            </div>
            {state.combo >= 3 && (
              <motion.div
                className="px-3 py-1 rounded-full text-sm font-bold"
                style={{
                  backgroundColor: 'rgba(255, 107, 157, 0.3)',
                  color: '#FF6B9D',
                  border: '1px solid #FF6B9D'
                }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                🔥 COMBO x1.5 🔥
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
