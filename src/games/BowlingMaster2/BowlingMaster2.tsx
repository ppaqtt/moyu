import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { BowlingMaster2Engine } from './engine';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 700;

const NEON_COLORS = {
  neonPink: '#ff6b9d',
  neonBlue: '#00d2ff',
  neonGreen: '#39ff14',
  gold: '#ffd700',
  darkPurple: 'rgba(26, 26, 46, 0.8)',
  white: '#ffffff',
  accent: '#a855f7',
};

export default function BowlingMaster2() {
  const navigate = useNavigate();
  const [engine] = useState(() => new BowlingMaster2Engine());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [frame, setFrame] = useState(1);
  const [throwNumber, setThrowNumber] = useState(1);
  const [highScore, setHighScore] = useLocalStorage('bowlingmaster2_highscore', 0);
  const [message, setMessage] = useState('');

  const { width, height } = engine.getCanvasSize();

  const drawLane = useCallback((ctx: CanvasRenderingContext2D) => {
    const laneLeft = 80;
    const laneRight = CANVAS_WIDTH - 80;
    const laneGrad = ctx.createLinearGradient(laneLeft, 0, laneRight, 0);
    laneGrad.addColorStop(0, '#2a1a0a');
    laneGrad.addColorStop(0.1, '#3d2815');
    laneGrad.addColorStop(0.5, '#4a3220');
    laneGrad.addColorStop(0.9, '#3d2815');
    laneGrad.addColorStop(1, '#2a1a0a');
    ctx.fillStyle = laneGrad;
    ctx.fillRect(laneLeft, 0, laneRight - laneLeft, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(laneLeft, 0);
    ctx.lineTo(laneLeft, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(laneRight, 0);
    ctx.lineTo(laneRight, CANVAS_HEIGHT);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    const dotY = CANVAS_HEIGHT - 150;
    for (let i = 0; i < 7; i++) {
      const dotX = laneLeft + 20 + i * (laneRight - laneLeft - 40) / 6;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
    const arrowY = CANVAS_HEIGHT - 200;
    for (let i = 0; i < 5; i++) {
      const arrowX = laneLeft + 40 + i * (laneRight - laneLeft - 80) / 4;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY - 10);
      ctx.lineTo(arrowX - 6, arrowY + 6);
      ctx.lineTo(arrowX + 6, arrowY + 6);
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(255, 50, 50, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(laneLeft, CANVAS_HEIGHT - 80);
    ctx.lineTo(laneRight, CANVAS_HEIGHT - 80);
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  const drawPin3D = useCallback((ctx: CanvasRenderingContext2D, pin: { x: number; y: number; z: number; radius: number; height: number; isStanding: boolean; rotationX: number; rotationZ: number }) => {
    const { x, y, z, radius, height: pinHeight, isStanding, rotationX, rotationZ } = pin;

    const scale = 1 - (y - 100) / CANVAS_HEIGHT * 0.3;
    const drawRadius = radius * scale;
    const drawHeight = pinHeight * scale;

    const depthOffset = z * 0.5;

    ctx.save();
    ctx.translate(x, y);

    if (!isStanding) {
      ctx.rotate(rotationZ);
      ctx.globalAlpha = 0.6;
    }

    ctx.fillStyle = '#d4c4a8';
    ctx.beginPath();
    ctx.ellipse(depthOffset, -drawHeight * 0.2, drawRadius * 0.9, drawRadius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    const pinGrad = ctx.createRadialGradient(-drawRadius * 0.3, -drawHeight * 0.5, 0, 0, -drawHeight * 0.5, drawRadius);
    pinGrad.addColorStop(0, '#ffffff');
    pinGrad.addColorStop(0.5, '#f5f0e6');
    pinGrad.addColorStop(1, '#c4a882');
    ctx.fillStyle = pinGrad;

    ctx.beginPath();
    ctx.moveTo(0, -drawHeight);
    ctx.bezierCurveTo(drawRadius * 0.8, -drawHeight * 0.7, drawRadius, -drawHeight * 0.3, drawRadius * 0.7, 0);
    ctx.lineTo(-drawRadius * 0.7, 0);
    ctx.bezierCurveTo(-drawRadius, -drawHeight * 0.3, -drawRadius * 0.8, -drawHeight * 0.7, 0, -drawHeight);
    ctx.fill();

    ctx.fillStyle = '#cc3333';
    ctx.beginPath();
    ctx.ellipse(0, -drawHeight * 0.4, drawRadius * 0.5, drawRadius * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -drawHeight * 0.55, drawRadius * 0.5, drawRadius * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(-drawRadius * 0.25, -drawHeight * 0.7, drawRadius * 0.2, drawRadius * 0.3, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, []);

  const drawBall3D = useCallback((ctx: CanvasRenderingContext2D, ball: { x: number; y: number; z: number; radius: number; rotation: number; isRolling: boolean }) => {
    const { x, y, z, radius, rotation } = ball;

    ctx.save();
    ctx.translate(x, y);

    const ballGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.5);
    ballGlow.addColorStop(0, 'rgba(108, 92, 231, 0.5)');
    ballGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = ballGlow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 2.5, 0, Math.PI * 2);
    ctx.fill();

    const ballGrad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
    ballGrad.addColorStop(0, '#a78bfa');
    ballGrad.addColorStop(0.5, '#7c3aed');
    ballGrad.addColorStop(1, '#4c1d95');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.rotate(rotation);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(-4, -4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, -4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, []);

  const drawAimLine = useCallback((ctx: CanvasRenderingContext2D, angle: number, power: number) => {
    const ballX = CANVAS_WIDTH / 2;
    const ballY = CANVAS_HEIGHT - 100;
    const lineLength = 80 + power * 4;

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(ballX, ballY);
    ctx.lineTo(
      ballX + Math.sin(angle) * lineLength,
      ballY - Math.cos(angle) * lineLength
    );
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(0, 210, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(
      ballX + Math.sin(angle) * lineLength,
      ballY - Math.cos(angle) * lineLength,
      5, 0, Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }, []);

  const drawPowerBar = useCallback((ctx: CanvasRenderingContext2D, power: number) => {
    const barWidth = 120;
    const barHeight = 12;
    const barX = CANVAS_WIDTH / 2 - barWidth / 2;
    const barY = CANVAS_HEIGHT - 40;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

    const fillWidth = (power / 20) * barWidth;
    const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    gradient.addColorStop(0, '#00ff88');
    gradient.addColorStop(0.5, '#ffff00');
    gradient.addColorStop(1, '#ff4444');
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, fillWidth, barHeight);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
  }, []);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D, particles: { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; color: string; size: number }[]) => {
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, []);

  const drawScoreBoard = useCallback((ctx: CanvasRenderingContext2D, history: { frame: number; throw1: number; throw2: number; throw3?: number; score: number }[], currentFrame: number) => {
    const boardHeight = 60;
    const boardY = 10;
    const boxWidth = 45;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(10, boardY, CANVAS_WIDTH - 20, boardHeight);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.strokeRect(10, boardY, CANVAS_WIDTH - 20, boardHeight);

    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';

    for (let i = 0; i < 10; i++) {
      const x = 35 + i * boxWidth;
      const isCurrent = i === currentFrame - 1;

      if (isCurrent) {
        ctx.fillStyle = 'rgba(168, 85, 247, 0.3)';
        ctx.fillRect(x - boxWidth / 2 + 2, boardY + 2, boxWidth - 4, boardHeight - 4);
      }

      ctx.fillStyle = isCurrent ? '#00d2ff' : '#ffd700';
      ctx.fillText(String(i + 1), x, boardY + 15);

      const entry = history[i];
      if (entry) {
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = entry.throw1 === 10 ? '#ff6b9d' : '#ffffff';
        ctx.fillText(entry.throw1 === 10 ? 'X' : (entry.throw1 === 0 ? '-' : String(entry.throw1)), x - 10, boardY + 35);

        if (entry.throw2 !== undefined) {
          if (entry.throw1 === 10) {
            ctx.fillStyle = entry.throw2 === 10 ? '#ff6b9d' : (entry.throw1 + entry.throw2 === 10 ? '#39ff14' : '#ffffff');
            ctx.fillText(entry.throw2 === 10 ? 'X' : (entry.throw2 === 0 ? '-' : String(entry.throw2)), x + 10, boardY + 35);
          } else {
            ctx.fillStyle = entry.throw1 + entry.throw2 === 10 ? '#39ff14' : '#ffffff';
            ctx.fillText(entry.throw1 + entry.throw2 === 10 ? '/' : (entry.throw2 === 0 ? '-' : String(entry.throw2)), x + 10, boardY + 35);
          }
        }

        if (entry.score > 0) {
          ctx.font = 'bold 11px Arial';
          ctx.fillStyle = '#ffd700';
          ctx.fillText(String(entry.score), x, boardY + 52);
        }
      }
    }
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = engine.getState();

    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#0f0f1a');
    bgGrad.addColorStop(0.5, '#1a1a2e');
    bgGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawLane(ctx);

    for (const pin of state.pins) {
      drawPin3D(ctx, pin);
    }

    if (state.ball.isRolling || state.phase === 'aiming' || state.phase === 'charging') {
      drawBall3D(ctx, state.ball);
    }

    drawParticles(ctx, state.particles);

    if (state.phase === 'aiming') {
      drawAimLine(ctx, state.angle, state.power);
    }

    if (state.phase === 'charging') {
      drawPowerBar(ctx, state.power);
    }

    drawScoreBoard(ctx, state.throwHistory, state.frame);

    if (state.message) {
      ctx.save();
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const msgColor = state.message === 'STRIKE!' ? '#ffd700' : '#00ffff';
      ctx.fillStyle = msgColor;
      ctx.shadowColor = msgColor;
      ctx.shadowBlur = 30;
      ctx.fillText(state.message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }, [engine, drawLane, drawPin3D, drawBall3D, drawAimLine, drawPowerBar, drawParticles, drawScoreBoard]);

  const gameLoop = useCallback(() => {
    engine.tick();
    const state = engine.getState();

    setScore(state.score);
    setFrame(state.frame);
    setThrowNumber(state.throwNumber);
    setMessage(state.message);

    render();

    if (state.phase === 'gameover') {
      setGameStatus('gameover');
      if (state.score > highScore) {
        setHighScore(state.score);
      }
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [engine, render, highScore, setHighScore]);

  const startGame = useCallback(() => {
    engine.reset();
    setScore(0);
    setFrame(1);
    setThrowNumber(1);
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
          engine.setAngle(engine.getState().angle - 0.1);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          engine.setAngle(engine.getState().angle + 0.1);
          break;
        case ' ':
          e.preventDefault();
          if (engine.getState().phase === 'aiming') {
            engine.startCharging();
          } else if (engine.getState().phase === 'charging') {
            engine.throw();
          }
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          engine.setSpin(engine.getState().spin - 0.1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          engine.setSpin(engine.getState().spin + 0.1);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;

      if (e.key === ' ' && engine.getState().phase === 'charging') {
        e.preventDefault();
        engine.throw();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [engine, gameStatus]);

  const handleCanvasClick = useCallback(() => {
    if (gameStatus !== 'playing') return;
    const state = engine.getState();

    if (state.phase === 'scoring') {
      engine.nextThrow();
    }
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
            <div className="text-center" style={{ backgroundColor: 'rgba(26, 26, 46, 0.8)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
              <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>回合</div>
              <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{frame}/10</div>
            </div>

            <div className="text-center" style={{ backgroundColor: 'rgba(26, 26, 46, 0.8)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255, 107, 157, 0.3)' }}>
              <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>当前得分</div>
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
          onClick={handleCanvasClick}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{ display: 'block', cursor: gameStatus === 'playing' ? 'crosshair' : 'default' }}
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
                  保龄球大师
                </motion.div>
                <motion.div
                  className="text-lg mb-8 opacity-70"
                  style={{ color: NEON_COLORS.neonBlue }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ delay: 0.3 }}
                >
                  Bowling Master 2 - 3D Edition
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
                  开始游戏
                </motion.button>

                <motion.div
                  className="text-sm opacity-60 text-center leading-6"
                  style={{ color: NEON_COLORS.gold }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ delay: 0.7 }}
                >
                  <div>← → 或 A D 调整投球方向</div>
                  <div>↑ ↓ 或 W S 调整旋转</div>
                  <div>空格 长按蓄力，松开投球</div>
                  <div>点击屏幕继续下一回合</div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {gameStatus === 'gameover' && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ backgroundColor: 'rgba(15, 15, 26, 0.92)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-4xl font-bold mb-4"
                  style={{ color: NEON_COLORS.neonPink, textShadow: `0 0 20px ${NEON_COLORS.neonPink}` }}
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
                  最终得分: {score}
                </motion.div>

                {score >= highScore && score > 0 && (
                  <motion.div
                    className="text-lg mb-4"
                    style={{ color: NEON_COLORS.neonGreen }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    🎉 新纪录！🎉
                  </motion.div>
                )}

                <div className="flex gap-4 mt-4">
                  <motion.button
                    onClick={startGame}
                    className="px-8 py-3 rounded-lg font-bold"
                    style={{
                      backgroundColor: NEON_COLORS.neonPink,
                      color: NEON_COLORS.white,
                      boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`,
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
                    onClick={() => navigate('/')}
                    className="px-8 py-3 rounded-lg font-bold"
                    style={{
                      backgroundColor: NEON_COLORS.darkPurple,
                      color: NEON_COLORS.neonBlue,
                      border: `2px solid ${NEON_COLORS.neonBlue}`,
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
          className="rounded-xl px-6 py-4 text-center"
          style={{
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            maxWidth: CANVAS_WIDTH,
            width: '100%',
          }}
        >
          <div className="flex justify-center gap-8 text-sm" style={{ color: NEON_COLORS.gold }}>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded text-xs font-mono" style={{ background: 'rgba(108, 92, 231, 0.3)', color: NEON_COLORS.white, border: '1px solid rgba(108, 92, 231, 0.5)' }}>空格</kbd>
              <span>长按蓄力投球</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded text-xs font-mono" style={{ background: 'rgba(108, 92, 231, 0.3)', color: NEON_COLORS.white, border: '1px solid rgba(108, 92, 231, 0.5)' }}>← →</kbd>
              <span>调整方向</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded text-xs font-mono" style={{ background: 'rgba(108, 92, 231, 0.3)', color: NEON_COLORS.white, border: '1px solid rgba(108, 92, 231, 0.5)' }}>↑ ↓</kbd>
              <span>调整旋转</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
