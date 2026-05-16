import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { BOWLING_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { BowlingEngine, BowlingState } from './engine';

const { CANVAS_WIDTH, CANVAS_HEIGHT, LANE_WIDTH, PIN_RADIUS } = BOWLING_CONSTANTS;

type GameStatus = 'idle' | 'playing' | 'gameover';

export default function Bowling() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BowlingEngine | null>(null);
  const animFrameRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number }>({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 });

  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [currentFrame, setCurrentFrame] = useState(1);
  const [currentRoll, setCurrentRoll] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [message, setMessage] = useState('');
  const [highScore, setHighScore] = useLocalStorage<number>(STORAGE_KEYS.BOWLING, 0);

  const navigate = useNavigate();

  useEffect(() => {
    engineRef.current = new BowlingEngine();
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, state: BowlingState) => {
    const { ball, pins, aimAngle, isCharging, chargePower, isRolling } = state;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const bgGrad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#0f0f1a');
    bgGrad.addColorStop(0.5, '#1a1a2e');
    bgGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const laneLeft = (CANVAS_WIDTH - LANE_WIDTH) / 2;
    const laneRight = (CANVAS_WIDTH + LANE_WIDTH) / 2;

    const laneGrad = ctx.createLinearGradient(laneLeft, 0, laneRight, 0);
    laneGrad.addColorStop(0, '#2a1a0a');
    laneGrad.addColorStop(0.1, '#3d2815');
    laneGrad.addColorStop(0.5, '#4a3220');
    laneGrad.addColorStop(0.9, '#3d2815');
    laneGrad.addColorStop(1, '#2a1a0a');
    ctx.fillStyle = laneGrad;
    ctx.fillRect(laneLeft, 0, LANE_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 2;
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
      const dotX = laneLeft + 20 + i * (LANE_WIDTH - 40) / 6;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
    const arrowY = CANVAS_HEIGHT - 200;
    for (let i = 0; i < 5; i++) {
      const arrowX = laneLeft + 40 + i * (LANE_WIDTH - 80) / 4;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY - 8);
      ctx.lineTo(arrowX - 5, arrowY + 4);
      ctx.lineTo(arrowX + 5, arrowY + 4);
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(255, 50, 50, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(laneLeft, CANVAS_HEIGHT - 80);
    ctx.lineTo(laneRight, CANVAS_HEIGHT - 80);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const pin of pins) {
      if (pin.standing) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(pin.x + 2, pin.y + 2, pin.radius, pin.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        const pinGrad = ctx.createRadialGradient(
          pin.x - pin.radius * 0.3, pin.y - pin.radius * 0.3, pin.radius * 0.1,
          pin.x, pin.y, pin.radius
        );
        pinGrad.addColorStop(0, '#ffffff');
        pinGrad.addColorStop(0.6, '#f0e6d3');
        pinGrad.addColorStop(1, '#c4a882');
        ctx.fillStyle = pinGrad;
        ctx.beginPath();
        ctx.arc(pin.x, pin.y, pin.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#cc3333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pin.x, pin.y, pin.radius * 0.65, -0.5, 0.5);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(pin.x - pin.radius * 0.25, pin.y - pin.radius * 0.25, pin.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.save();
        ctx.translate(pin.x, pin.y);
        ctx.rotate(pin.rotation);
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#c4a882';
        ctx.beginPath();
        ctx.arc(0, 0, pin.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }

    if (!isRolling && !state.isGameOver) {
      const ballX = CANVAS_WIDTH / 2;
      const ballY = CANVAS_HEIGHT - 50;
      const lineLength = 120;

      ctx.strokeStyle = 'rgba(0, 210, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(ballX, ballY);
      ctx.lineTo(
        ballX + Math.sin(aimAngle) * lineLength,
        ballY - Math.cos(aimAngle) * lineLength
      );
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(0, 210, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(
        ballX + Math.sin(aimAngle) * lineLength,
        ballY - Math.cos(aimAngle) * lineLength,
        4, 0, Math.PI * 2
      );
      ctx.fill();
    }

    if (isCharging) {
      const ballX = CANVAS_WIDTH / 2;
      const ballY = CANVAS_HEIGHT - 50;
      const maxBarWidth = 80;
      const barHeight = 8;
      const barX = ballX - maxBarWidth / 2;
      const barY = ballY + 25;
      const fillWidth = (chargePower / 15) * maxBarWidth;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(barX, barY, maxBarWidth, barHeight);

      const powerRatio = chargePower / 15;
      const barColor = powerRatio < 0.5
        ? `rgba(0, 210, 255, ${0.5 + powerRatio})`
        : `rgba(255, ${Math.round(107 * (1 - powerRatio))}, ${Math.round(157 * (1 - powerRatio))}, ${0.5 + powerRatio * 0.5})`;
      ctx.fillStyle = barColor;
      ctx.fillRect(barX, barY, fillWidth, barHeight);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, maxBarWidth, barHeight);
    }

    if (ball.active || !isRolling) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(ball.x + 3, ball.y + 3, ball.radius, ball.radius * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      const ballGlow = ctx.createRadialGradient(
        ball.x, ball.y, 0,
        ball.x, ball.y, ball.radius * 2.5
      );
      ballGlow.addColorStop(0, 'rgba(108, 92, 231, 0.4)');
      ballGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = ballGlow;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      const ballGrad = ctx.createRadialGradient(
        ball.x - ball.radius * 0.3,
        ball.y - ball.radius * 0.3,
        ball.radius * 0.1,
        ball.x,
        ball.y,
        ball.radius
      );
      ballGrad.addColorStop(0, '#8b5cf6');
      ballGrad.addColorStop(0.5, '#6c5ce7');
      ballGrad.addColorStop(1, '#4a3ab5');
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(ball.x, ball.y);
      ctx.rotate(ball.rotation);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(-3, -3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(3, -3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(ball.x - ball.radius * 0.25, ball.y - ball.radius * 0.25, ball.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    if (state.message) {
      ctx.save();
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const msgColor = state.message === 'STRIKE!' ? '#ff6b9d' : '#39ff14';
      ctx.fillStyle = msgColor;
      ctx.shadowColor = msgColor;
      ctx.shadowBlur = 20;
      ctx.fillText(state.message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.shadowBlur = 0;
      ctx.restore();
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

      setCurrentFrame(state.currentFrame + 1);
      setCurrentRoll(state.currentRoll + 1);
      setTotalScore(state.totalScore);
      setMessage(state.message);

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
      mouseRef.current = { x, y };

      if (gameStatus !== 'playing' || engine.getState().isRolling) return;

      const ballX = CANVAS_WIDTH / 2;
      const ballY = CANVAS_HEIGHT - 50;
      const dx = x - ballX;
      const dy = ballY - y;
      const angle = Math.atan2(dx, dy);
      engine.setAimAngle(angle);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (gameStatus !== 'playing') return;
      e.preventDefault();
      engine.startCharging();
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (gameStatus !== 'playing') return;
      e.preventDefault();
      engine.releaseBall();
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

  const handleStart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
      setTotalScore(0);
      setCurrentFrame(1);
      setCurrentRoll(1);
      setMessage('');
      setGameStatus('playing');
    }
  }, []);

  const handleRestart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
      setTotalScore(0);
      setCurrentFrame(1);
      setCurrentRoll(1);
      setMessage('');
      setGameStatus('playing');
    }
  }, []);

  const handleGoHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const getFrameDisplay = useCallback((frames: BowlingState['frames']) => {
    return frames.map((frame, i) => {
      let roll1 = '';
      let roll2 = '';
      let roll3 = '';

      if (i < 9) {
        if (frame.isStrike) {
          roll1 = '';
          roll2 = 'X';
        } else if (frame.rolls.length >= 1) {
          roll1 = frame.rolls[0] === 0 ? '-' : String(frame.rolls[0]);
          if (frame.isSpare) {
            roll2 = '/';
          } else if (frame.rolls.length >= 2) {
            roll2 = frame.rolls[1] === 0 ? '-' : String(frame.rolls[1]);
          }
        }
      } else {
        if (frame.rolls.length >= 1) {
          roll1 = frame.rolls[0] === 10 ? 'X' : (frame.rolls[0] === 0 ? '-' : String(frame.rolls[0]));
        }
        if (frame.rolls.length >= 2) {
          if (frame.isStrike && frame.rolls[1] === 10) {
            roll2 = 'X';
          } else if (frame.isStrike && frame.rolls[1] + (frame.rolls[0] === 10 ? 0 : frame.rolls[0]) === 10) {
            roll2 = '/';
          } else if (!frame.isStrike && frame.rolls[0] + frame.rolls[1] === 10) {
            roll2 = '/';
          } else {
            roll2 = frame.rolls[1] === 0 ? '-' : String(frame.rolls[1]);
          }
        }
        if (frame.rolls.length >= 3) {
          roll3 = frame.rolls[2] === 10 ? 'X' : (frame.rolls[2] === 0 ? '-' : String(frame.rolls[2]));
        }
      }

      return { roll1, roll2, roll3, score: frame.score, isStrike: frame.isStrike, isSpare: frame.isSpare };
    });
  }, []);

  const engineState = engineRef.current?.getState();
  const frameDisplays = engineState ? getFrameDisplay(engineState.frames) : [];

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
              backgroundColor: '#1a1a2e',
              color: '#00d2ff',
              boxShadow: '0 0 10px rgba(0,210,255,0.4)'
            }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0,210,255,0.8)' }}
            whileTap={{ scale: 0.95 }}
          >
            ← 返回
          </motion.button>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs opacity-70" style={{ color: '#ffd700' }}>
                局 {currentFrame}/10
              </div>
              <div className="text-sm" style={{ color: '#00d2ff' }}>
                第 {currentRoll} 投
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>
                当前得分
              </div>
              <motion.div
                className="text-3xl font-bold"
                style={{ color: '#ff6b9d' }}
                key={totalScore}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.15 }}
              >
                {totalScore}
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
        </div>

        <div
          className="glass-card rounded-xl px-2 py-2"
          style={{
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(108, 92, 231, 0.3)',
            maxWidth: CANVAS_WIDTH,
            width: '100%'
          }}
        >
          <div className="flex gap-0.5">
            {frameDisplays.map((fd, i) => (
              <div
                key={i}
                className="flex-1 text-center rounded"
                style={{
                  background: i === currentFrame - 1 && gameStatus === 'playing'
                    ? 'rgba(108, 92, 231, 0.3)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: i === currentFrame - 1 && gameStatus === 'playing'
                    ? '1px solid rgba(108, 92, 231, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.05)',
                  padding: '2px'
                }}
              >
                <div className="text-xs font-bold" style={{ color: '#00d2ff', fontSize: '10px' }}>
                  {i + 1}
                </div>
                <div className="flex justify-center" style={{ fontSize: '10px', minHeight: '16px' }}>
                  <span style={{ color: fd.isStrike ? '#ff6b9d' : '#ffffff', padding: '0 1px' }}>
                    {fd.roll1}
                  </span>
                  <span style={{ color: fd.isSpare ? '#39ff14' : '#ffffff', padding: '0 1px' }}>
                    {fd.roll2}
                  </span>
                  {i === 9 && (
                    <span style={{ color: '#ffffff', padding: '0 1px' }}>
                      {fd.roll3}
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold" style={{ color: '#ffd700', fontSize: '10px', minHeight: '14px' }}>
                  {fd.score !== null ? fd.score : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(108, 92, 231, 0.3)',
            boxShadow: '0 0 30px rgba(255,107,157,0.3), inset 0 0 50px rgba(0,0,0,0.5)'
          }}
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
                style={{ backgroundColor: 'rgba(15, 15, 26, 0.85)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-5xl font-bold mb-3"
                  style={{
                    color: '#ff6b9d',
                    textShadow: '0 0 20px rgba(255,107,157,0.8)'
                  }}
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  保龄球
                </motion.div>
                <motion.div
                  className="text-lg mb-8"
                  style={{ color: '#00d2ff' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Bowling
                </motion.div>

                <motion.button
                  onClick={handleStart}
                  className="px-8 py-3 rounded-xl font-bold text-lg mb-6"
                  style={{
                    background: 'linear-gradient(135deg, #ff6b9d, #a855f7)',
                    color: '#ffffff',
                    boxShadow: '0 0 25px rgba(255,107,157,0.8)'
                  }}
                  whileHover={{ scale: 1.08, boxShadow: '0 0 40px rgba(255,107,157,1)' }}
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
                  <div>鼠标移动调整方向</div>
                  <div>按住鼠标蓄力，松开投球</div>
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
                    textShadow: '0 0 20px rgba(255,107,157,0.8)'
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
                  最终得分: {totalScore}
                </motion.div>

                {totalScore >= highScore && totalScore > 0 && (
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
                      boxShadow: '0 0 20px rgba(255,107,157,0.8)'
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
                鼠标
              </kbd>
              <span>调整方向</span>
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
                点击
              </kbd>
              <span>蓄力投球</span>
            </div>
          </div>
          <div className="mt-2 text-xs opacity-50" style={{ color: '#ffd700' }}>
            Strike(全中) +10 奖励分 | Spare(补中) +5 奖励分 | 共 10 局
          </div>
        </div>
      </div>
    </div>
  );
}
