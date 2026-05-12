import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { RINGTOSS_CONSTANTS, STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { RingTossEngine, RingTossState } from './engine';

const { CANVAS_WIDTH, CANVAS_HEIGHT, RING_RADIUS, POLE_RADIUS, TOTAL_RINGS } = RINGTOSS_CONSTANTS;

type GameStatus = 'idle' | 'playing' | 'gameover';

export default function RingToss() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RingTossEngine | null>(null);
  const animFrameRef = useRef<number>(0);

  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [remainingRings, setRemainingRings] = useState(TOTAL_RINGS);
  const [totalScore, setTotalScore] = useState(0);
  const [highScore, setHighScore] = useLocalStorage<number>(STORAGE_KEYS.RINGTOSS, 0);

  const navigate = useNavigate();

  // Initialize engine
  useEffect(() => {
    engineRef.current = new RingTossEngine();
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Drawing
  const draw = useCallback((ctx: CanvasRenderingContext2D, state: RingTossState) => {
    const { poles, rings, aimAngle, aimPower, isCharging, isThrowing, message, messageTimer, particles, throwX, throwY } = state;

    // Clear
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#0f0f1a');
    bgGrad.addColorStop(0.5, '#1a1a2e');
    bgGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Ground area
    const groundGrad = ctx.createLinearGradient(0, CANVAS_HEIGHT - 80, 0, CANVAS_HEIGHT);
    groundGrad.addColorStop(0, 'rgba(26, 26, 46, 0.5)');
    groundGrad.addColorStop(1, 'rgba(22, 33, 62, 0.8)');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, CANVAS_HEIGHT - 80, CANVAS_WIDTH, 80);

    // Ground line
    ctx.strokeStyle = 'rgba(108, 92, 231, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT - 80);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 80);
    ctx.stroke();

    // Draw poles
    for (const pole of poles) {
      // Pole shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(pole.x + 3, pole.y + 3, POLE_RADIUS + 2, POLE_RADIUS + 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pole glow
      const poleGlow = ctx.createRadialGradient(pole.x, pole.y, 0, pole.x, pole.y, POLE_RADIUS * 3);
      poleGlow.addColorStop(0, pole.glowColor);
      poleGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = poleGlow;
      ctx.beginPath();
      ctx.arc(pole.x, pole.y, POLE_RADIUS * 3, 0, Math.PI * 2);
      ctx.fill();

      // Pole base (wider circle)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(pole.x, pole.y + POLE_RADIUS + 2, POLE_RADIUS + 4, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pole body
      const poleGrad = ctx.createRadialGradient(
        pole.x - POLE_RADIUS * 0.3, pole.y - POLE_RADIUS * 0.3, POLE_RADIUS * 0.1,
        pole.x, pole.y, POLE_RADIUS
      );
      poleGrad.addColorStop(0, '#ffffff');
      poleGrad.addColorStop(0.4, pole.color);
      poleGrad.addColorStop(1, '#333333');
      ctx.fillStyle = poleGrad;
      ctx.beginPath();
      ctx.arc(pole.x, pole.y, POLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Pole top highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(pole.x - POLE_RADIUS * 0.2, pole.y - POLE_RADIUS * 0.2, POLE_RADIUS * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Score label
      ctx.save();
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = pole.color;
      ctx.shadowColor = pole.color;
      ctx.shadowBlur = 8;
      ctx.fillText(String(pole.score), pole.x, pole.y - POLE_RADIUS - 12);
      ctx.shadowBlur = 0;
      ctx.restore();

      // Ring on pole
      if (pole.hasRing) {
        ctx.save();
        ctx.strokeStyle = pole.ringColor;
        ctx.lineWidth = 4;
        ctx.shadowColor = pole.ringColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(pole.x, pole.y + 2, RING_RADIUS, RING_RADIUS * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }

    // Draw landed rings (missed)
    for (const ring of rings) {
      if (!ring.landed || ring.scored) continue;

      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(ring.x, ring.y, RING_RADIUS, RING_RADIUS * 0.3, ring.rotation, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Draw active rings
    for (const ring of rings) {
      if (!ring.active) continue;

      ctx.save();
      // Ring shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(ring.x + 3, ring.y + 3, ring.radius, ring.radius * 0.4, ring.rotation, 0, Math.PI * 2);
      ctx.fill();

      // Ring glow
      ctx.shadowColor = ring.color;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(ring.x, ring.y, ring.radius, ring.radius * 0.4, ring.rotation, 0, Math.PI * 2);
      ctx.stroke();

      // Inner ring
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(ring.x, ring.y, ring.radius * 0.7, ring.radius * 0.28, ring.rotation, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw particles
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw aim guide (when not throwing and has rings)
    if (!isThrowing && !state.isGameOver && state.remainingRings > 0) {
      const lineLength = aimPower * 8;

      // Trajectory preview (dotted arc)
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = 'rgba(0, 210, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const steps = 20;
      let px = throwX;
      let py = throwY;
      let pvx = Math.cos(aimAngle) * aimPower;
      let pvy = Math.sin(aimAngle) * aimPower;

      ctx.moveTo(px, py);
      for (let i = 0; i < steps; i++) {
        pvy += 0.25;
        pvx *= 0.995;
        pvy *= 0.995;
        px += pvx;
        py += pvy;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Aim direction line
      ctx.strokeStyle = 'rgba(0, 210, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(throwX, throwY);
      ctx.lineTo(
        throwX + Math.cos(aimAngle) * 40,
        throwY + Math.sin(aimAngle) * 40
      );
      ctx.stroke();

      // Current ring at throw position
      ctx.save();
      ctx.strokeStyle = (['#ff6b6b','#4ecdc4','#45b7d1','#96ceb4','#ffeaa7','#fd79a8','#a29bfe','#00b894','#e17055','#6c5ce7'])[TOTAL_RINGS - state.remainingRings] || '#ff6b6b';
      ctx.lineWidth = 4;
      ctx.shadowColor = ctx.strokeStyle as string;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(throwX, throwY, RING_RADIUS, RING_RADIUS * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Draw charge indicator
    if (isCharging) {
      const maxBarWidth = 80;
      const barHeight = 8;
      const barX = throwX - maxBarWidth / 2;
      const barY = throwY + 30;
      const fillWidth = (aimPower / RINGTOSS_CONSTANTS.THROW_POWER) * maxBarWidth;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(barX, barY, maxBarWidth, barHeight);

      const powerRatio = aimPower / RINGTOSS_CONSTANTS.THROW_POWER;
      const barColor = powerRatio < 0.5
        ? `rgba(0, 210, 255, ${0.5 + powerRatio})`
        : `rgba(255, ${Math.round(107 * (1 - powerRatio))}, ${Math.round(157 * (1 - powerRatio))}, ${0.5 + powerRatio * 0.5})`;
      ctx.fillStyle = barColor;
      ctx.fillRect(barX, barY, fillWidth, barHeight);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, maxBarWidth, barHeight);
    }

    // Draw score message
    if (message && messageTimer > 0) {
      ctx.save();
      const alpha = Math.min(1, messageTimer / 20);
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const msgY = CANVAS_HEIGHT / 2 - (60 - messageTimer) * 0.5;
      ctx.fillStyle = NEON_COLORS.neonGreen;
      ctx.shadowColor = NEON_COLORS.neonGreen;
      ctx.shadowBlur = 20;
      ctx.fillText(message, CANVAS_WIDTH / 2, msgY);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }, []);

  // Game loop
  const gameLoop = useCallback(() => {
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    if (!engine || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (gameStatus === 'playing') {
      engine.tick();
      const state = engine.getState();

      setRemainingRings(state.remainingRings);
      setTotalScore(state.totalScore);

      if (state.isGameOver) {
        setGameStatus('gameover');
        if (state.totalScore > highScore) {
          setHighScore(state.totalScore);
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

  // Mouse controls
  useEffect(() => {
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    if (!engine || !canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (gameStatus !== 'playing' || engine.getState().isThrowing) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const state = engine.getState();
      const dx = x - state.throwX;
      const dy = y - state.throwY;
      const angle = Math.atan2(dy, dx);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const power = Math.min(RINGTOSS_CONSTANTS.THROW_POWER, Math.max(3, distance / 20));

      engine.setAim(angle, power);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (gameStatus !== 'playing') return;
      e.preventDefault();
      engine.startCharging();
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (gameStatus !== 'playing') return;
      e.preventDefault();
      engine.throwRing();
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gameStatus]);

  // Start game
  const handleStart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
      setTotalScore(0);
      setRemainingRings(TOTAL_RINGS);
      setGameStatus('playing');
    }
  }, []);

  // Restart game
  const handleRestart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
      setTotalScore(0);
      setRemainingRings(TOTAL_RINGS);
      setGameStatus('playing');
    }
  }, []);

  // Navigate home
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
      <div className="flex flex-col items-center gap-4">
        {/* Header */}
        <div className="flex items-center justify-between w-full" style={{ maxWidth: CANVAS_WIDTH }}>
          <motion.button
            onClick={handleGoHome}
            className="px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300"
            style={{
              backgroundColor: NEON_COLORS.darkPurple,
              color: NEON_COLORS.neonBlue,
              boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}40`
            }}
            whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${NEON_COLORS.neonBlue}` }}
            whileTap={{ scale: 0.95 }}
          >
            &larr; 返回
          </motion.button>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>
                剩余圈数
              </div>
              <motion.div
                className="text-2xl font-bold"
                style={{ color: NEON_COLORS.neonCyan }}
                key={remainingRings}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.15 }}
              >
                {remainingRings}/{TOTAL_RINGS}
              </motion.div>
            </div>

            <div className="text-center">
              <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>
                当前得分
              </div>
              <motion.div
                className="text-3xl font-bold"
                style={{ color: NEON_COLORS.neonPink }}
                key={totalScore}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.15 }}
              >
                {totalScore}
              </motion.div>
            </div>

            <div className="text-center">
              <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>
                最高分
              </div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>
                {highScore}
              </div>
            </div>
          </div>
        </div>

        {/* Score tier legend */}
        <div
          className="glass-card rounded-xl px-4 py-2"
          style={{
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(108, 92, 231, 0.3)',
            maxWidth: CANVAS_WIDTH,
            width: '100%'
          }}
        >
          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: '#4ecdc4', boxShadow: '0 0 6px #4ecdc4' }}
              />
              <span style={{ color: NEON_COLORS.white }}>10分</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: '#45b7d1', boxShadow: '0 0 6px #45b7d1' }}
              />
              <span style={{ color: NEON_COLORS.white }}>20分</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: '#f39c12', boxShadow: '0 0 6px #f39c12' }}
              />
              <span style={{ color: NEON_COLORS.white }}>30分</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: '#ff6b9d', boxShadow: '0 0 6px #ff6b9d' }}
              />
              <span style={{ color: NEON_COLORS.white }}>50分</span>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(108, 92, 231, 0.3)',
            boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30, inset 0 0 50px rgba(0,0,0,0.5)`
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{ display: 'block', cursor: gameStatus === 'playing' ? 'crosshair' : 'default' }}
          />

          {/* Idle overlay */}
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
                    color: NEON_COLORS.neonPink,
                    textShadow: `0 0 20px ${NEON_COLORS.neonPink}`
                  }}
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  套圈圈
                </motion.div>
                <motion.div
                  className="text-lg mb-8"
                  style={{ color: NEON_COLORS.neonBlue }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Ring Toss
                </motion.div>

                <motion.button
                  onClick={handleStart}
                  className="px-8 py-3 rounded-xl font-bold text-lg mb-6"
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.accent})`,
                    color: NEON_COLORS.white,
                    boxShadow: `0 0 25px ${NEON_COLORS.neonPink}80`
                  }}
                  whileHover={{ scale: 1.08, boxShadow: `0 0 40px ${NEON_COLORS.neonPink}` }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  开始游戏
                </motion.button>

                <motion.div
                  className="text-sm opacity-60 text-center leading-6"
                  style={{ color: NEON_COLORS.gold }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ delay: 0.7 }}
                >
                  <div>移动鼠标调整角度和力度</div>
                  <div>点击投掷圈圈</div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Game Over overlay */}
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
                    color: NEON_COLORS.neonPink,
                    textShadow: `0 0 20px ${NEON_COLORS.neonPink}`
                  }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                >
                  游戏结束
                </motion.div>

                <motion.div
                  className="text-2xl mb-2"
                  style={{ color: NEON_COLORS.gold }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  最终得分: {totalScore}
                </motion.div>

                {totalScore >= highScore && totalScore > 0 && (
                  <motion.div
                    className="text-lg mb-4"
                    style={{ color: NEON_COLORS.neonGreen }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    新纪录!
                  </motion.div>
                )}

                <div className="flex gap-4 mt-4">
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
                      backgroundColor: NEON_COLORS.darkPurple,
                      color: NEON_COLORS.neonBlue,
                      border: `2px solid ${NEON_COLORS.neonBlue}`
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    返回首页
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls hint */}
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
          <div className="flex justify-center gap-8 text-sm" style={{ color: NEON_COLORS.gold }}>
            <div className="flex items-center gap-2">
              <kbd
                className="px-2 py-1 rounded text-xs font-mono"
                style={{
                  background: 'rgba(108, 92, 231, 0.3)',
                  color: NEON_COLORS.white,
                  border: '1px solid rgba(108, 92, 231, 0.5)'
                }}
              >
                鼠标移动
              </kbd>
              <span>调整角度和力度</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd
                className="px-3 py-1 rounded text-xs font-mono"
                style={{
                  background: 'rgba(108, 92, 231, 0.3)',
                  color: NEON_COLORS.white,
                  border: '1px solid rgba(108, 92, 231, 0.5)'
                }}
              >
                点击
              </kbd>
              <span>投掷圈圈</span>
            </div>
          </div>
          <div className="mt-2 text-xs opacity-50" style={{ color: NEON_COLORS.gold }}>
            共 {TOTAL_RINGS} 个圈 | 不同颜色柱子分值不同 | 套中柱子即可得分
          </div>
        </div>
      </div>
    </div>
  );
}
