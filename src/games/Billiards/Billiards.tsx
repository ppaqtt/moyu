import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { BILLIARDS_CONSTANTS, STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { BilliardsEngine, BilliardsState, Ball } from './engine';

const { CANVAS_WIDTH, CANVAS_HEIGHT, BALL_RADIUS, POCKET_RADIUS } = BILLIARDS_CONSTANTS;

type GameStatus = 'idle' | 'aiming' | 'playing' | 'gameover';

export default function Billiards() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BilliardsEngine | null>(null);
  const animFrameRef = useRef<number>(0);

  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [shotCount, setShotCount] = useState(0);
  const [pocketedCount, setPocketedCount] = useState(0);
  const [message, setMessage] = useState('');
  const [highScore, setHighScore] = useLocalStorage<number>(STORAGE_KEYS.BILLIARDS, 0);

  const navigate = useNavigate();

  // Initialize engine
  useEffect(() => {
    engineRef.current = new BilliardsEngine();
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Drawing
  const draw = useCallback((ctx: CanvasRenderingContext2D, state: BilliardsState) => {
    const { balls, pockets, cueBall, isCharging, chargePower, aimAngle, pocketedBalls, message } = state;

    // Clear
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#0f0f1a');
    bgGrad.addColorStop(0.5, '#1a1a2e');
    bgGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Table felt
    const tableMargin = 20;
    const feltGrad = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 50,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.6
    );
    feltGrad.addColorStop(0, '#1a6b3c');
    feltGrad.addColorStop(1, '#0d4a25');
    ctx.fillStyle = feltGrad;
    ctx.beginPath();
    ctx.roundRect(tableMargin, tableMargin, CANVAS_WIDTH - tableMargin * 2, CANVAS_HEIGHT - tableMargin * 2, 8);
    ctx.fill();

    // Table border (cushion rail)
    ctx.strokeStyle = '#5c3a1e';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.roundRect(tableMargin - 2, tableMargin - 2, CANVAS_WIDTH - tableMargin * 2 + 4, CANVAS_HEIGHT - tableMargin * 2 + 4, 10);
    ctx.stroke();

    // Outer frame
    ctx.strokeStyle = '#3d2510';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(tableMargin - 8, tableMargin - 8, CANVAS_WIDTH - tableMargin * 2 + 16, CANVAS_HEIGHT - tableMargin * 2 + 16, 12);
    ctx.stroke();

    // Diamond markers on rails
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    const diamondPositions = [0.25, 0.5, 0.75];
    for (const pos of diamondPositions) {
      // Top rail
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH * pos, tableMargin - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      // Bottom rail
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH * pos, CANVAS_HEIGHT - tableMargin + 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    const sideDiamonds = [0.25, 0.5, 0.75];
    for (const pos of sideDiamonds) {
      // Left rail
      ctx.beginPath();
      ctx.arc(tableMargin - 2, CANVAS_HEIGHT * pos, 3, 0, Math.PI * 2);
      ctx.fill();
      // Right rail
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH - tableMargin + 2, CANVAS_HEIGHT * pos, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Head string line (where cue ball starts)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH * 0.25, tableMargin);
    ctx.lineTo(CANVAS_WIDTH * 0.25, CANVAS_HEIGHT - tableMargin);
    ctx.stroke();
    ctx.setLineDash([]);

    // Foot spot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH * 0.72, CANVAS_HEIGHT / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw pockets
    for (const pocket of pockets) {
      // Pocket shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, pocket.radius + 3, 0, Math.PI * 2);
      ctx.fill();

      // Pocket hole
      const pocketGrad = ctx.createRadialGradient(
        pocket.x, pocket.y, 0,
        pocket.x, pocket.y, pocket.radius
      );
      pocketGrad.addColorStop(0, '#000000');
      pocketGrad.addColorStop(0.7, '#1a1a1a');
      pocketGrad.addColorStop(1, '#333333');
      ctx.fillStyle = pocketGrad;
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, pocket.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw aim line
    if (!cueBall.pocketed && (gameStatus === 'aiming' || gameStatus === 'playing') && !state.allMoving) {
      const lineLength = 200;

      // Dotted aim line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(cueBall.x, cueBall.y);
      ctx.lineTo(
        cueBall.x + Math.cos(aimAngle) * lineLength,
        cueBall.y + Math.sin(aimAngle) * lineLength
      );
      ctx.stroke();
      ctx.setLineDash([]);

      // Cue stick (behind the ball)
      if (!state.allMoving) {
        const cueLength = 180;
        const cueOffset = isCharging ? BALL_RADIUS + 5 + chargePower * 2 : BALL_RADIUS + 5;
        const cueStartX = cueBall.x - Math.cos(aimAngle) * cueOffset;
        const cueStartY = cueBall.y - Math.sin(aimAngle) * cueOffset;
        const cueEndX = cueStartX - Math.cos(aimAngle) * cueLength;
        const cueEndY = cueStartY - Math.sin(aimAngle) * cueLength;

        // Cue stick shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cueStartX + 2, cueStartY + 2);
        ctx.lineTo(cueEndX + 2, cueEndY + 2);
        ctx.stroke();

        // Cue stick body
        const cueGrad = ctx.createLinearGradient(cueStartX, cueStartY, cueEndX, cueEndY);
        cueGrad.addColorStop(0, '#f5e6c8');
        cueGrad.addColorStop(0.05, '#1a1a1a');
        cueGrad.addColorStop(0.08, '#f5e6c8');
        cueGrad.addColorStop(0.5, '#c4954a');
        cueGrad.addColorStop(1, '#3d2510');
        ctx.strokeStyle = cueGrad;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(cueStartX, cueStartY);
        ctx.lineTo(cueEndX, cueEndY);
        ctx.stroke();

        // Cue tip
        ctx.fillStyle = '#4a90d9';
        ctx.beginPath();
        ctx.arc(cueStartX, cueStartY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw balls
    for (const ball of balls) {
      if (ball.pocketed) continue;
      drawBall(ctx, ball);
    }

    // Draw charge indicator
    if (isCharging && !cueBall.pocketed) {
      const barWidth = 100;
      const barHeight = 10;
      const barX = cueBall.x - barWidth / 2;
      const barY = cueBall.y + BALL_RADIUS + 20;
      const fillWidth = (chargePower / 18) * barWidth;

      // Bar background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.roundRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, 4);
      ctx.fill();

      // Bar fill with gradient
      const powerRatio = chargePower / 18;
      const barGrad = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
      barGrad.addColorStop(0, '#00d2ff');
      barGrad.addColorStop(0.5, '#ffd700');
      barGrad.addColorStop(1, '#ff6b9d');
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(barX, barY, fillWidth, barHeight, 3);
      ctx.fill();

      // Bar border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, 4);
      ctx.stroke();
    }

    // Draw message
    if (message) {
      ctx.save();
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const msgColor = message.includes('犯规') ? NEON_COLORS.neonPink
        : message.includes('获胜') ? NEON_COLORS.neonGreen
        : NEON_COLORS.gold;

      ctx.fillStyle = msgColor;
      ctx.shadowColor = msgColor;
      ctx.shadowBlur = 15;
      ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Draw pocketed balls display (bottom of table)
    if (pocketedBalls.length > 0) {
      const startX = CANVAS_WIDTH / 2 - (pocketedBalls.length * (BALL_RADIUS * 1.5)) / 2;
      for (let i = 0; i < pocketedBalls.length; i++) {
        const ballId = pocketedBalls[i];
        const bx = startX + i * (BALL_RADIUS * 1.5) + BALL_RADIUS;
        const by = CANVAS_HEIGHT - 8;
        const miniRadius = BALL_RADIUS * 0.6;

        ctx.globalAlpha = 0.7;
        ctx.fillStyle = ballId === 0 ? '#ffffff' : BALL_COLORS_MAP[ballId] || '#ffffff';
        ctx.beginPath();
        ctx.arc(bx, by, miniRadius, 0, Math.PI * 2);
        ctx.fill();

        if (ballId >= 9) {
          // Stripe indicator
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(bx, by, miniRadius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Number
        if (ballId > 0) {
          ctx.fillStyle = ballId === 8 ? '#ffffff' : '#000000';
          ctx.font = `bold ${miniRadius}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(ballId), bx, by);
        }
        ctx.globalAlpha = 1;
      }
    }
  }, [gameStatus]);

  // Game loop
  const gameLoop = useCallback(() => {
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    if (!engine || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    engine.tick();
    const state = engine.getState();

    setShotCount(state.shotCount);
    setPocketedCount(state.pocketedBalls.filter(id => id !== 0).length);
    setMessage(state.message);

    if (state.isGameOver) {
      setGameStatus('gameover');
      const score = state.pocketedBalls.filter(id => id !== 0 && id !== 8).length;
      if (state.isWin && score > highScore) {
        setHighScore(score);
      }
    } else if (state.gameState === 'aiming') {
      setGameStatus('aiming');
    } else if (state.gameState === 'playing') {
      if (gameStatus === 'idle') {
        setGameStatus('playing');
      }
    }

    draw(ctx, state);
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
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      if (gameStatus === 'playing' || gameStatus === 'aiming') {
        engine.setAim(x, y);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (gameStatus !== 'playing' && gameStatus !== 'aiming') return;
      e.preventDefault();
      engine.startCharging();
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (gameStatus !== 'playing' && gameStatus !== 'aiming') return;
      e.preventDefault();
      engine.releaseShot();
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
      setShotCount(0);
      setPocketedCount(0);
      setMessage('');
      setGameStatus('playing');
    }
  }, []);

  // Restart game
  const handleRestart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
      setShotCount(0);
      setPocketedCount(0);
      setMessage('');
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
                击球次数
              </div>
              <motion.div
                className="text-2xl font-bold"
                style={{ color: NEON_COLORS.neonBlue }}
                key={shotCount}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.15 }}
              >
                {shotCount}
              </motion.div>
            </div>

            <div className="text-center">
              <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>
                进球数
              </div>
              <motion.div
                className="text-2xl font-bold"
                style={{ color: NEON_COLORS.neonPink }}
                key={pocketedCount}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.15 }}
              >
                {pocketedCount}
              </motion.div>
            </div>

            <div className="text-center">
              <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>
                最高分
              </div>
              <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>
                {highScore}
              </div>
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
            style={{ display: 'block', cursor: gameStatus === 'playing' || gameStatus === 'aiming' ? 'crosshair' : 'default' }}
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
                  台球
                </motion.div>
                <motion.div
                  className="text-lg mb-8"
                  style={{ color: NEON_COLORS.neonBlue }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  8-Ball Billiards
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
                  <div>鼠标移动瞄准方向</div>
                  <div>按住鼠标蓄力，松开击球</div>
                  <div>将所有彩球打入袋中，最后打入8号球获胜</div>
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
                    color: message.includes('获胜') ? NEON_COLORS.neonGreen : NEON_COLORS.neonPink,
                    textShadow: `0 0 20px ${message.includes('获胜') ? NEON_COLORS.neonGreen : NEON_COLORS.neonPink}`
                  }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                >
                  {message.includes('获胜') ? '恭喜获胜!' : '游戏结束'}
                </motion.div>

                <motion.div
                  className="text-xl mb-2"
                  style={{ color: NEON_COLORS.gold }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  击球 {shotCount} 次 | 进球 {pocketedCount} 个
                </motion.div>

                {pocketedCount >= highScore && pocketedCount > 0 && (
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
                    再来一局
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
              <span>瞄准方向</span>
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
                按住点击
              </kbd>
              <span>蓄力击球</span>
            </div>
          </div>
          <div className="mt-2 text-xs opacity-50" style={{ color: NEON_COLORS.gold }}>
            母球进袋犯规(重置位置) | 8号球最后打入获胜 | 尽量用最少击球次数清台
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Ball Colors Map (for pocketed display) ----

const BALL_COLORS_MAP: Record<number, string> = {
  0: '#ffffff',
  1: '#f5d442',
  2: '#2563eb',
  3: '#dc2626',
  4: '#7c3aed',
  5: '#f97316',
  6: '#16a34a',
  7: '#92400e',
  8: '#111111',
  9: '#f5d442',
  10: '#2563eb',
  11: '#dc2626',
  12: '#7c3aed',
  13: '#f97316',
  14: '#16a34a',
  15: '#92400e',
};

// ---- Draw a single ball ----

function drawBall(ctx: CanvasRenderingContext2D, ball: Ball): void {
  const { x, y, radius, color, stripe, number } = ball;

  // Ball shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x + 2, y + 2, radius, radius * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  if (number === 0) {
    // Cue ball
    const cueGrad = ctx.createRadialGradient(
      x - radius * 0.3, y - radius * 0.3, radius * 0.1,
      x, y, radius
    );
    cueGrad.addColorStop(0, '#ffffff');
    cueGrad.addColorStop(0.7, '#e8e8e8');
    cueGrad.addColorStop(1, '#cccccc');
    ctx.fillStyle = cueGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Cue ball highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (stripe) {
    // Stripe ball: white base with colored stripe
    // White base
    const baseGrad = ctx.createRadialGradient(
      x - radius * 0.3, y - radius * 0.3, radius * 0.1,
      x, y, radius
    );
    baseGrad.addColorStop(0, '#ffffff');
    baseGrad.addColorStop(0.7, '#f0f0f0');
    baseGrad.addColorStop(1, '#dddddd');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Color stripe (middle band)
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = color;
    ctx.fillRect(x - radius, y - radius * 0.55, radius * 2, radius * 1.1);
    ctx.restore();

    // Number circle (white background)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.42, 0, Math.PI * 2);
    ctx.fill();

    // Number text
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${radius * 0.65}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(number), x, y + 0.5);

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Solid ball
    const ballGrad = ctx.createRadialGradient(
      x - radius * 0.3, y - radius * 0.3, radius * 0.1,
      x, y, radius
    );
    ballGrad.addColorStop(0, lightenColor(color, 40));
    ballGrad.addColorStop(0.6, color);
    ballGrad.addColorStop(1, darkenColor(color, 30));
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Number circle (white background)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.42, 0, Math.PI * 2);
    ctx.fill();

    // Number text
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${radius * 0.65}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(number), x, y + 0.5);

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ball border
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

// ---- Color Helpers ----

function lightenColor(hex: string, amount: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `rgb(${r}, ${g}, ${b})`;
}

function darkenColor(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `rgb(${r}, ${g}, ${b})`;
}
