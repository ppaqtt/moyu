import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { NineBallEngine, GameState, Ball } from './engine';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const BALL_RADIUS = 12;

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
  9: '#dc2626',
};

export default function NineBall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<NineBallEngine | null>(null);
  const animFrameRef = useRef<number>(0);

  const [gameStatus, setGameStatus] = useState<GameState['gameState']>('idle');
  const [shotCount, setShotCount] = useState(0);
  const [currentTarget, setCurrentTarget] = useState(1);
  const [message, setMessage] = useState('');
  const [score, setScore] = useState(0);
  const [racksWon, setRacksWon] = useState(0);
  const [isBallInHand, setIsBallInHand] = useState(false);
  const [highScore, setHighScore] = useLocalStorage<number>('nineBallHighScore', 0);

  const navigate = useNavigate();

  useEffect(() => {
    engineRef.current = new NineBallEngine();
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const drawBall = useCallback((ctx: CanvasRenderingContext2D, ball: Ball, isTarget: boolean) => {
    const { x, y, radius, color, number } = ball;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 2, radius, radius * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();

    if (number === 0) {
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

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
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

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.font = `bold ${radius * 0.7}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(number), x, y + 0.5);

      if (isTarget) {
        ctx.strokeStyle = NEON_COLORS.gold;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    const { balls, pockets, cueBall, isCharging, chargePower, aimAngle, message, gameState, currentTarget } = state;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const bgGrad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#1a0a2e');
    bgGrad.addColorStop(0.5, '#2e1a3e');
    bgGrad.addColorStop(1, '#1a1a3e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const tableMargin = 20;
    const feltGrad = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 50,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.6
    );
    feltGrad.addColorStop(0, '#1a4b3c');
    feltGrad.addColorStop(1, '#0d3a25');
    ctx.fillStyle = feltGrad;
    ctx.beginPath();
    ctx.roundRect(tableMargin, tableMargin, CANVAS_WIDTH - tableMargin * 2, CANVAS_HEIGHT - tableMargin * 2, 8);
    ctx.fill();

    ctx.strokeStyle = '#6b3a1e';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.roundRect(tableMargin - 3, tableMargin - 3, CANVAS_WIDTH - tableMargin * 2 + 6, CANVAS_HEIGHT - tableMargin * 2 + 6, 10);
    ctx.stroke();

    ctx.strokeStyle = '#4d2510';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(tableMargin - 10, tableMargin - 10, CANVAS_WIDTH - tableMargin * 2 + 20, CANVAS_HEIGHT - tableMargin * 2 + 20, 12);
    ctx.stroke();

    for (const pocket of pockets) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, pocket.radius + 3, 0, Math.PI * 2);
      ctx.fill();

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

    const allMoving = balls.some(b => !b.pocketed && (Math.abs(b.vx) > 0.1 || Math.abs(b.vy) > 0.1));

    if (!cueBall.pocketed && (gameState === 'aiming' || gameState === 'playing') && !allMoving && !isBallInHand) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(cueBall.x, cueBall.y);
      ctx.lineTo(
        cueBall.x + Math.cos(aimAngle) * 200,
        cueBall.y + Math.sin(aimAngle) * 200
      );
      ctx.stroke();
      ctx.setLineDash([]);

      const cueLength = 180;
      const cueOffset = isCharging ? BALL_RADIUS + 5 + chargePower * 2 : BALL_RADIUS + 5;
      const cueStartX = cueBall.x - Math.cos(aimAngle) * cueOffset;
      const cueStartY = cueBall.y - Math.sin(aimAngle) * cueOffset;
      const cueEndX = cueStartX - Math.cos(aimAngle) * cueLength;
      const cueEndY = cueStartY - Math.sin(aimAngle) * cueLength;

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cueStartX + 2, cueStartY + 2);
      ctx.lineTo(cueEndX + 2, cueEndY + 2);
      ctx.stroke();

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

      ctx.fillStyle = '#d94a90';
      ctx.beginPath();
      ctx.arc(cueStartX, cueStartY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const ball of balls) {
      if (ball.pocketed) continue;
      const isTarget = ball.id === currentTarget;
      drawBall(ctx, ball, isTarget);
    }

    if (isCharging && !cueBall.pocketed) {
      const barWidth = 100;
      const barHeight = 10;
      const barX = cueBall.x - barWidth / 2;
      const barY = cueBall.y + BALL_RADIUS + 20;
      const fillWidth = (chargePower / 20) * barWidth;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.roundRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, 4);
      ctx.fill();

      const powerRatio = chargePower / 20;
      const barGrad = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
      barGrad.addColorStop(0, '#00d2ff');
      barGrad.addColorStop(0.5, '#ffd700');
      barGrad.addColorStop(1, '#ff6b9d');
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(barX, barY, fillWidth, barHeight, 3);
      ctx.fill();
    }

    if (message) {
      ctx.save();
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const msgColor = message.includes('犯规') ? NEON_COLORS.neonPink
        : message.includes('获胜') || message.includes('清台') ? NEON_COLORS.neonGreen
        : NEON_COLORS.gold;

      ctx.fillStyle = msgColor;
      ctx.shadowColor = msgColor;
      ctx.shadowBlur = 20;
      ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = NEON_COLORS.gold;
    ctx.fillText(`目标球: ${currentTarget}`, 30, 50);
  }, [drawBall, isBallInHand]);

  const gameLoop = useCallback(() => {
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    if (!engine || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    engine.tick();
    const state = engine.getState();

    setShotCount(state.shotCount);
    setCurrentTarget(state.currentTarget);
    setMessage(state.message);
    setScore(state.score);
    setRacksWon(state.racksWon);
    setIsBallInHand(state.ballInHand);

    if (state.isGameOver) {
      setGameStatus('gameover');
      if (state.score > highScore) {
        setHighScore(state.score);
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
        if (!isBallInHand) {
          engine.setAim(x, y);
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (gameStatus !== 'playing' && gameStatus !== 'aiming') return;
      e.preventDefault();
      if (!isBallInHand) {
        engine.startCharging();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (gameStatus !== 'playing' && gameStatus !== 'aiming') return;
      e.preventDefault();
      if (!isBallInHand) {
        engine.releaseShot();
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!isBallInHand) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      engine.placeCueBall(x, y);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('click', handleClick);
    };
  }, [gameStatus, isBallInHand]);

  const handleStart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
      setShotCount(0);
      setCurrentTarget(1);
      setMessage('');
      setScore(0);
      setRacksWon(0);
      setIsBallInHand(false);
      setGameStatus('playing');
    }
  }, []);

  const handleRestart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
      setShotCount(0);
      setCurrentTarget(1);
      setMessage('');
      setScore(0);
      setRacksWon(0);
      setIsBallInHand(false);
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
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-between w-full" style={{ maxWidth: CANVAS_WIDTH }}>
          <motion.button
            onClick={handleGoHome}
            className="px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300"
            style={{
              backgroundColor: NEON_COLORS.darkPurple,
              color: NEON_COLORS.neonPurple,
              boxShadow: `0 0 10px ${NEON_COLORS.neonPurple}40`
            }}
            whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${NEON_COLORS.neonPurple}` }}
            whileTap={{ scale: 0.95 }}
          >
            &larr; 返回
          </motion.button>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>
                当前目标
              </div>
              <motion.div
                className="text-2xl font-bold"
                style={{ color: NEON_COLORS.neonPink }}
                key={currentTarget}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {currentTarget}
              </motion.div>
            </div>

            <div className="text-center">
              <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>
                分数
              </div>
              <motion.div
                className="text-2xl font-bold"
                style={{ color: NEON_COLORS.accent }}
                key={score}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.15 }}
              >
                {score}
              </motion.div>
            </div>

            <div className="text-center">
              <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>
                胜局
              </div>
              <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonGreen }}>
                {racksWon}
              </div>
            </div>
          </div>
        </div>

        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(138, 43, 226, 0.3)',
            boxShadow: `0 0 30px ${NEON_COLORS.neonPurple}30, inset 0 0 50px rgba(0,0,0,0.5)`
          }}
        >
          {isBallInHand && (
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-bold z-10"
              style={{
                backgroundColor: NEON_COLORS.neonGreen,
                color: NEON_COLORS.white,
              }}
            >
              点击放置母球
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              display: 'block',
              cursor: isBallInHand ? 'pointer' : (gameStatus === 'playing' || gameStatus === 'aiming' ? 'crosshair' : 'default')
            }}
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
                    color: NEON_COLORS.neonPurple,
                    textShadow: `0 0 20px ${NEON_COLORS.neonPurple}`
                  }}
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  9球挑战
                </motion.div>
                <motion.div
                  className="text-lg mb-8"
                  style={{ color: NEON_COLORS.neonPink }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Nine Ball Challenge
                </motion.div>

                <motion.button
                  onClick={handleStart}
                  className="px-8 py-3 rounded-xl font-bold text-lg mb-6"
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.neonPurple}, ${NEON_COLORS.neonPink})`,
                    color: NEON_COLORS.white,
                    boxShadow: `0 0 25px ${NEON_COLORS.neonPurple}80`
                  }}
                  whileHover={{ scale: 1.08, boxShadow: `0 0 40px ${NEON_COLORS.neonPurple}` }}
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
                  <div>必须按顺序击球(1→2→3...→9)</div>
                  <div>先击中最低号码的球</div>
                  <div>进球可继续击球，清台获胜</div>
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
                  最终分数: {score} | 胜局: {racksWon}
                </motion.div>

                {score >= highScore && score > 0 && (
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
                      backgroundColor: NEON_COLORS.neonPurple,
                      color: NEON_COLORS.white,
                      boxShadow: `0 0 20px ${NEON_COLORS.neonPurple}`
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
                      color: NEON_COLORS.neonPurple,
                      border: `2px solid ${NEON_COLORS.neonPurple}`
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

        <div
          className="glass-card rounded-xl px-6 py-4 text-center"
          style={{
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(138, 43, 226, 0.3)',
            maxWidth: CANVAS_WIDTH,
            width: '100%'
          }}
        >
          <div className="flex justify-center gap-8 text-sm" style={{ color: NEON_COLORS.gold }}>
            <div className="flex items-center gap-2">
              <kbd
                className="px-2 py-1 rounded text-xs font-mono"
                style={{
                  background: 'rgba(138, 43, 226, 0.3)',
                  color: NEON_COLORS.white,
                  border: '1px solid rgba(138, 43, 226, 0.5)'
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
                  background: 'rgba(138, 43, 226, 0.3)',
                  color: NEON_COLORS.white,
                  border: '1px solid rgba(138, 43, 226, 0.5)'
                }}
              >
                按住点击
              </kbd>
              <span>蓄力击球</span>
            </div>
          </div>
          <div className="mt-2 text-xs opacity-50" style={{ color: NEON_COLORS.gold }}>
            金色边框球为当前目标球 | 连续3次犯规扣分
          </div>
        </div>
      </div>
    </div>
  );
}

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
