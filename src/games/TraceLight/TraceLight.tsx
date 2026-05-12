import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../utils/constants';
import { TraceLightEngine, LightPoint } from './engine';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 600;
const POINT_RADIUS = 30;

const NEON_COLORS = [
  '#FF6B9D',
  '#00D2FF',
  '#A855F7',
  '#22C55E',
  '#FFD700',
  '#FF8800'
];

export default function TraceLight() {
  const navigate = useNavigate();
  const [engine] = useState(() => new TraceLightEngine());
  const [state, setState] = useState(() => engine.getState());
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [highScore, setHighScore] = useLocalStorage(STORAGE_KEYS.TRACE_LIGHT || 'tracelight_highscore', 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [catchEffects, setCatchEffects] = useState<{ x: number; y: number; key: number }[]>([]);
  const effectKeyRef = useRef(0);

  const getPointColor = (index: number): string => {
    return NEON_COLORS[index % NEON_COLORS.length];
  };

  const drawTrail = useCallback((ctx: CanvasRenderingContext2D, point: LightPoint, index: number) => {
    if (point.trail.length < 2) return;

    const color = getPointColor(index);

    for (let i = 0; i < point.trail.length - 1; i++) {
      const t = point.trail[i];
      const alpha = t.alpha * 0.6;
      const radius = point.radius * (1 - i / point.trail.length) * 0.8;

      ctx.beginPath();
      ctx.arc(t.x, t.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('#', '');

      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.fill();
    }
  }, []);

  const drawPoint = useCallback((ctx: CanvasRenderingContext2D, point: LightPoint, index: number) => {
    if (!point.isActive) return;

    const color = getPointColor(index);

    ctx.save();

    const glowGradient = ctx.createRadialGradient(
      point.x, point.y, 0,
      point.x, point.y, point.radius * 2
    );
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.5)`);
    glowGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.2)`);
    glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.radius * 2, 0, Math.PI * 2);
    ctx.fill();

    const innerGradient = ctx.createRadialGradient(
      point.x - point.radius / 3, point.y - point.radius / 3, 0,
      point.x, point.y, point.radius
    );
    innerGradient.addColorStop(0, '#FFFFFF');
    innerGradient.addColorStop(0.3, color);
    innerGradient.addColorStop(1, shadeColor(color, -30));

    ctx.fillStyle = innerGradient;
    ctx.shadowColor = color;
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  }, []);

  const drawCatchEffect = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const elapsed = Date.now() - effectKeyRef.current;
    const progress = Math.min(elapsed / 500, 1);

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 100 * progress);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${1 - progress})`);
    gradient.addColorStop(0.5, `rgba(0, 255, 136, ${0.5 - progress * 0.5})`);
    gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 100 * progress, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const shadeColor = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 +
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (let i = 0; i < 50; i++) {
      const x = (i * 137) % CANVAS_WIDTH;
      const y = (i * 251) % CANVAS_HEIGHT;
      const size = 1 + (i % 3);
      const alpha = 0.3 + (i % 5) * 0.1;

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    state.points.forEach((point, index) => {
      if (point.isActive) {
        drawTrail(ctx, point, index);
      }
    });

    state.points.forEach((point, index) => {
      drawPoint(ctx, point, index);
    });

    catchEffects.forEach(effect => {
      const elapsed = Date.now() - effect.key;
      if (elapsed < 500) {
        const progress = elapsed / 500;
        const gradient = ctx.createRadialGradient(
          effect.x, effect.y, 0,
          effect.x, effect.y, 100 * progress
        );
        gradient.addColorStop(0, `rgba(0, 255, 136, ${1 - progress})`);
        gradient.addColorStop(0.5, `rgba(0, 255, 136, ${0.5 - progress * 0.5})`);
        gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, 100 * progress, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    if (gameStatus === 'idle') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 20;
      ctx.fillText('✨ 追踪光点 ✨', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

      ctx.font = '24px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 10;
      ctx.fillText('点击跟随移动的光点!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

      ctx.font = '18px Arial';
      ctx.fillStyle = '#888888';
      ctx.shadowBlur = 0;
      ctx.fillText('光点会越来越快', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
      ctx.fillText('点击开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
    }

    if (gameStatus === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 20;
      ctx.fillText('🏆 游戏结束! 🏆', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.fillText(`最终得分: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

      ctx.font = '24px Arial';
      ctx.fillStyle = '#00D2FF';
      ctx.shadowColor = '#00D2FF';
      ctx.fillText(`达到等级: ${state.level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);

      ctx.fillStyle = '#00FF88';
      ctx.shadowColor = '#00FF88';
      ctx.fillText(`捕捉次数: ${state.totalCatches}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);

      ctx.fillStyle = '#FF4444';
      ctx.shadowColor = '#FF4444';
      ctx.fillText(`失误次数: ${state.missCount}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 105);
      ctx.shadowBlur = 0;
    }
  }, [state, gameStatus, catchEffects, drawTrail, drawPoint]);

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
    if (gameStatus === 'idle') {
      setGameStatus('playing');
      engine.reset();
      setState({ ...engine.getState() });
      return;
    }

    if (gameStatus !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const caught = engine.handleClick(x, y);
    setState({ ...engine.getState() });

    if (caught) {
      setCatchEffects(prev => [...prev.slice(-5), { x, y, key: Date.now() }]);
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
          boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)',
          border: '2px solid rgba(255, 215, 0, 0.3)'
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
                ✨
              </motion.div>

              <motion.h2
                className="text-4xl font-bold mb-2"
                style={{ color: '#FFD700' }}
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

              <motion.div
                className="text-lg mb-2"
                style={{ color: '#00D2FF' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                达到等级: {state.level}
              </motion.div>

              <motion.div
                className="text-lg mb-2"
                style={{ color: '#00FF88' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                捕捉次数: {state.totalCatches}
              </motion.div>

              <motion.div
                className="text-lg mb-4"
                style={{ color: '#FF4444' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                失误次数: {state.missCount}
              </motion.div>

              {state.score >= highScore && state.score > 0 && (
                <motion.div
                  className="text-xl font-bold mb-4"
                  style={{ color: '#00FF88' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
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
                    backgroundColor: '#FFD700',
                    color: '#0a0a1a',
                    boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)'
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
          border: '1px solid rgba(255, 215, 0, 0.3)'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="text-sm opacity-70" style={{ color: '#FFD700' }}>
          {gameStatus === 'idle' && '点击画布开始游戏'}
          {gameStatus === 'playing' && '追踪并点击移动的光点!'}
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
          <div className="flex items-center gap-6">
            <div className="text-sm" style={{ color: '#39FF14' }}>
              等级: <span className="font-bold text-lg">{state.level}</span>
            </div>
            <div className="text-sm" style={{ color: '#A855F7' }}>
              捕捉: <span className="font-bold text-lg">{state.catchCount}/5</span>
            </div>
            <div className="text-sm" style={{ color: '#FF6B9D' }}>
              速度: <span className="font-bold text-lg">{state.currentSpeed.toFixed(1)}x</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
