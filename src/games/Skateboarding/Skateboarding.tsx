import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { SkateboardingEngine } from './engine';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;

const NEON_COLORS = {
  neonPink: '#ff6b9d',
  neonBlue: '#00d2ff',
  neonGreen: '#39ff14',
  gold: '#ffd700',
  darkPurple: 'rgba(26, 26, 46, 0.8)',
  white: '#ffffff',
  accent: '#a855f7',
};

export default function Skateboarding() {
  const navigate = useNavigate();
  const [engine] = useState(() => new SkateboardingEngine());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [message, setMessage] = useState('');
  const [highScore, setHighScore] = useLocalStorage('skateboarding_highscore', 0);

  const { width, height } = engine.getCanvasSize();
  const trickList = engine.getTrickList();

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGrad.addColorStop(0, '#1a1a2e');
    skyGrad.addColorStop(0.5, '#2d1b4e');
    skyGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < 50; i++) {
      const x = (i * 73 + Date.now() / 50) % CANVAS_WIDTH;
      const y = (i * 47) % (CANVAS_HEIGHT - 100);
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    const groundGrad = ctx.createLinearGradient(0, 320, 0, CANVAS_HEIGHT);
    groundGrad.addColorStop(0, '#333333');
    groundGrad.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 320, CANVAS_WIDTH, CANVAS_HEIGHT - 320);

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 322);
    ctx.lineTo(CANVAS_WIDTH, 322);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 325);
      ctx.lineTo(i + 20, CANVAS_HEIGHT);
      ctx.stroke();
    }
  }, []);

  const drawRamp = useCallback((ctx: CanvasRenderingContext2D, ramp: { x: number; y: number; width: number; height: number; type: string }) => {
    const { x, y, width: w, height: h, type } = ramp;

    const rampGrad = ctx.createLinearGradient(x, y - h, x, y);
    rampGrad.addColorStop(0, '#666666');
    rampGrad.addColorStop(1, '#333333');

    if (type === 'quarter_pipe') {
      ctx.fillStyle = rampGrad;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y - h);
      ctx.lineTo(x, y);
      ctx.fill();

      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (type === 'half_pipe') {
      ctx.fillStyle = rampGrad;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + w / 2, y - h * 2, x + w, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x, y);
      ctx.fill();

      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + w / 2, y - h * 2, x + w, y);
      ctx.stroke();
    } else if (type === 'rail') {
      ctx.fillStyle = rampGrad;
      ctx.fillRect(x, y - h, w, h);

      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, y - h);
      ctx.lineTo(x + w, y - h);
      ctx.stroke();

      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y - h, w, h);
    }
  }, []);

  const drawSkater = useCallback((ctx: CanvasRenderingContext2D, skater: { x: number; y: number; rotation: number; boardAngle: number; isAirborne: boolean; currentTrick: string | null }) => {
    ctx.save();
    ctx.translate(skater.x, skater.y);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(3, 3, 25, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.rotate(skater.boardAngle);

    ctx.fillStyle = '#4a4a4a';
    ctx.beginPath();
    ctx.roundRect(-25, 5, 50, 8, 3);
    ctx.fill();

    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(-22, 9, 4, 0, Math.PI * 2);
    ctx.arc(22, 9, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.save();
    ctx.rotate(skater.rotation);

    ctx.fillStyle = '#ffcc99';
    ctx.beginPath();
    ctx.arc(0, -15, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.ellipse(0, -30, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(-4, -17, 2, 0, Math.PI * 2);
    ctx.arc(4, -17, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-3, -18, 1, 0, Math.PI * 2);
    ctx.arc(5, -18, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff6b9d';
    ctx.beginPath();
    ctx.ellipse(0, -8, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3366ff';
    ctx.beginPath();
    ctx.moveTo(-8, -20);
    ctx.lineTo(-12, -35);
    ctx.lineTo(12, -35);
    ctx.lineTo(8, -20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(-12, -35, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (skater.currentTrick) {
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 10;
      ctx.fillText(skater.currentTrick, 0, -50);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }, []);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D, particles: { x: number; y: number; life: number; color: string; size: number }[]) => {
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, []);

  const drawScorePopup = useCallback((ctx: CanvasRenderingContext2D, tricks: { name: string; score: number; multiplier: number }[]) => {
    let yOffset = 50;
    for (const trick of tricks.slice(-5)) {
      ctx.save();
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 10;
      ctx.fillText(`${trick.name} +${trick.score}`, CANVAS_WIDTH - 20, yOffset);
      ctx.shadowBlur = 0;
      ctx.restore();
      yOffset += 25;
    }
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = engine.getState();

    drawBackground(ctx);

    for (const ramp of state.ramps) {
      drawRamp(ctx, ramp);
    }

    drawSkater(ctx, state.skater);
    drawParticles(ctx, state.particles);
    drawScorePopup(ctx, state.tricks);

    if (state.message) {
      ctx.save();
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const isPositive = !state.message.includes('摔倒');
      ctx.fillStyle = isPositive ? '#ffd700' : '#ff4444';
      ctx.shadowColor = isPositive ? '#ffd700' : '#ff4444';
      ctx.shadowBlur = 20;
      ctx.fillText(state.message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.restore();
    }

    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`距离: ${Math.floor(state.distance)}m`, 20, 30);
  }, [engine, drawBackground, drawRamp, drawSkater, drawParticles, drawScorePopup]);

  const gameLoop = useCallback(() => {
    engine.tick();
    const state = engine.getState();

    setScore(state.score);
    setCombo(state.combo);
    setMessage(state.message);

    render();

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [engine, render]);

  const startGame = useCallback(() => {
    engine.reset();
    setScore(0);
    setCombo(0);
    setMessage('');
    setGameStatus('playing');
  }, [engine]);

  useEffect(() => {
    if (gameStatus === 'playing') {
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [gameStatus, gameLoop]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          engine.moveLeft();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          engine.moveRight();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          e.preventDefault();
          engine.jump();
          break;
        case '1':
          engine.performTrick(0);
          break;
        case '2':
          engine.performTrick(1);
          break;
        case '3':
          engine.performTrick(2);
          break;
        case '4':
          engine.performTrick(3);
          break;
        case '5':
          engine.performTrick(4);
          break;
        case '6':
          engine.performTrick(5);
          break;
        case '7':
          engine.performTrick(6);
          break;
        case '8':
          engine.performTrick(7);
          break;
        case '9':
          engine.performTrick(8);
          break;
        case '0':
          engine.performTrick(9);
          break;
        case 'Shift':
          e.preventDefault();
          engine.addSpeedBoost();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [engine, gameStatus]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-between w-full" style={{ maxWidth: CANVAS_WIDTH }}>
          <motion.button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300"
            style={{
              backgroundColor: NEON_COLORS.darkPurple,
              color: NEON_COLORS.neonBlue,
              boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}40`,
              border: `1px solid ${NEON_COLORS.neonBlue}40`,
            }}
            whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${NEON_COLORS.neonBlue}` }}
            whileTap={{ scale: 0.95 }}
          >
            ← 返回
          </motion.button>

          <div className="flex items-center gap-6">
            <div className="text-center" style={{ backgroundColor: 'rgba(26, 26, 46, 0.8)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255, 107, 157, 0.3)' }}>
              <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>得分</div>
              <motion.div
                className="text-3xl font-bold"
                style={{ color: NEON_COLORS.neonPink }}
                key={score}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.15 }}
              >
                {score}
              </motion.div>
            </div>

            <div className="text-center" style={{ backgroundColor: 'rgba(26, 26, 46, 0.8)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
              <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>连击</div>
              <div className="text-2xl font-bold" style={{ color: combo > 1 ? NEON_COLORS.neonGreen : NEON_COLORS.gold }}>
                {combo}x
              </div>
            </div>

            <div className="text-center" style={{ backgroundColor: 'rgba(26, 26, 46, 0.8)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
              <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>最高分</div>
              <div className="text-xl font-bold" style={{ color: NEON_COLORS.gold }}>{highScore}</div>
            </div>
          </div>
        </div>

        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            background: 'rgba(26, 26, 46, 0.9)',
            border: '2px solid rgba(168, 85, 247, 0.4)',
            boxShadow: `0 0 30px rgba(168, 85, 247, 0.3)`,
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
                style={{ backgroundColor: 'rgba(15, 15, 26, 0.9)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-5xl font-bold mb-2"
                  style={{ color: NEON_COLORS.neonPink, textShadow: `0 0 20px ${NEON_COLORS.neonPink}` }}
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  花样滑板
                </motion.div>
                <motion.div
                  className="text-lg mb-8 opacity-70"
                  style={{ color: NEON_COLORS.neonBlue }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ delay: 0.3 }}
                >
                  Skateboarding - 花式表演
                </motion.div>

                <motion.button
                  onClick={startGame}
                  className="px-10 py-4 rounded-xl text-xl font-bold mb-6"
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.accent})`,
                    color: NEON_COLORS.white,
                    boxShadow: `0 0 25px ${NEON_COLORS.neonPink}80`,
                  }}
                  whileHover={{ scale: 1.08, boxShadow: `0 0 40px ${NEON_COLORS.neonPink}` }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  开始表演
                </motion.button>

                <motion.div
                  className="text-sm opacity-60 text-center leading-6"
                  style={{ color: NEON_COLORS.gold }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ delay: 0.7 }}
                >
                  <div>← → 或 A D 左右移动</div>
                  <div>空格 或 W 或 ↑ 跳跃</div>
                  <div>1-0 执行花式动作</div>
                  <div>Shift 加速</div>
                </motion.div>

                <motion.div
                  className="mt-4 text-xs opacity-50 text-center"
                  style={{ color: NEON_COLORS.neonBlue }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: 0.9 }}
                >
                  <div>空中执行动作可获得分数</div>
                  <div>连续完成动作获得连击加分</div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div
          className="rounded-xl px-6 py-4 text-center"
          style={{
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            maxWidth: CANVAS_WIDTH,
            width: '100%',
          }}
        >
          <div className="flex justify-center gap-4 text-sm flex-wrap" style={{ color: NEON_COLORS.gold }}>
            {trickList.slice(0, 5).map((trick, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1 rounded" style={{ background: 'rgba(108, 92, 231, 0.2)' }}>
                <kbd className="px-1 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(108, 92, 231, 0.4)', color: NEON_COLORS.white }}>{i + 1}</kbd>
                <span>{trick.name}</span>
                <span className="text-xs opacity-70">+{trick.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-xl px-6 py-3 text-center"
          style={{
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            maxWidth: CANVAS_WIDTH,
            width: '100%',
          }}
        >
          <div className="flex justify-center gap-4 text-sm flex-wrap" style={{ color: NEON_COLORS.gold }}>
            {trickList.slice(5, 10).map((trick, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1 rounded" style={{ background: 'rgba(108, 92, 231, 0.2)' }}>
                <kbd className="px-1 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(108, 92, 231, 0.4)', color: NEON_COLORS.white }}>{i + 6}</kbd>
                <span>{trick.name}</span>
                <span className="text-xs opacity-70">+{trick.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
