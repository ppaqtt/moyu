import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { SurfingEngine } from './engine';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 500;
const WATER_LEVEL = 350;

const NEON_COLORS = {
  neonPink: '#ff6b9d',
  neonBlue: '#00d2ff',
  neonGreen: '#39ff14',
  gold: '#ffd700',
  darkPurple: 'rgba(26, 26, 46, 0.8)',
  white: '#ffffff',
  accent: '#a855f7',
};

export default function Surfing() {
  const navigate = useNavigate();
  const [engine] = useState(() => new SurfingEngine());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [distance, setDistance] = useState(0);
  const [message, setMessage] = useState('');
  const [highScore, setHighScore] = useLocalStorage('surfing_highscore', 0);

  const { width, height } = engine.getCanvasSize();
  const trickList = engine.getTrickList();

  const drawSky = useCallback((ctx: CanvasRenderingContext2D) => {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, WATER_LEVEL);
    skyGrad.addColorStop(0, '#1a0533');
    skyGrad.addColorStop(0.3, '#4a1a6b');
    skyGrad.addColorStop(0.6, '#ff6b35');
    skyGrad.addColorStop(0.8, '#ffd700');
    skyGrad.addColorStop(1, '#ff8c00');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, WATER_LEVEL);

    ctx.fillStyle = '#ff6347';
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH - 80, 80, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 30; i++) {
      const x = (i * 97 + Date.now() / 100) % CANVAS_WIDTH;
      const y = (i * 53) % (WATER_LEVEL - 50);
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  const drawOcean = useCallback((ctx: CanvasRenderingContext2D, waves: { x: number; y: number; width: number; height: number; amplitude: number; frequency: number; phase: number; type: string }[]) => {
    for (const wave of waves) {
      if (wave.type === 'big' || wave.type === 'tube') {
        const waveGrad = ctx.createLinearGradient(wave.x, wave.y - wave.height, wave.x, wave.y + wave.height);
        waveGrad.addColorStop(0, wave.type === 'tube' ? '#00bfff' : '#1e90ff');
        waveGrad.addColorStop(1, '#00008b');
        ctx.fillStyle = waveGrad;

        ctx.beginPath();
        ctx.moveTo(wave.x, wave.y + wave.height);

        for (let x = 0; x <= wave.width; x += 5) {
          const y = wave.y + Math.sin((x + wave.phase * 100) * wave.frequency) * wave.amplitude;
          ctx.lineTo(wave.x + x, y);
        }

        ctx.lineTo(wave.x + wave.width, wave.y + wave.height);
        ctx.closePath();
        ctx.fill();

        if (wave.type === 'tube') {
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let x = 0; x <= wave.width; x += 5) {
            const y = wave.y + Math.sin((x + wave.phase * 100) * wave.frequency) * wave.amplitude;
            if (x === 0) ctx.moveTo(wave.x + x, y);
            else ctx.lineTo(wave.x + x, y);
          }
          ctx.stroke();
        }
      }
    }

    const oceanGrad = ctx.createLinearGradient(0, WATER_LEVEL, 0, CANVAS_HEIGHT);
    oceanGrad.addColorStop(0, '#1e90ff');
    oceanGrad.addColorStop(0.3, '#00bfff');
    oceanGrad.addColorStop(0.7, '#00008b');
    oceanGrad.addColorStop(1, '#000033');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, WATER_LEVEL, CANVAS_WIDTH, CANVAS_HEIGHT - WATER_LEVEL);

    for (const wave of waves) {
      if (wave.type !== 'big' && wave.type !== 'tube') {
        ctx.beginPath();
        ctx.moveTo(0, CANVAS_HEIGHT);

        for (let x = 0; x <= CANVAS_WIDTH; x += 5) {
          const y = wave.y + Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.closePath();

        const foamGrad = ctx.createLinearGradient(0, WATER_LEVEL - wave.amplitude, 0, WATER_LEVEL + wave.amplitude);
        foamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        foamGrad.addColorStop(1, 'rgba(135, 206, 250, 0.3)');
        ctx.fillStyle = foamGrad;
        ctx.fill();
      }
    }
  }, []);

  const drawObstacle = useCallback((ctx: CanvasRenderingContext2D, obstacle: { x: number; y: number; type: string; radius: number }) => {
    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);

    if (obstacle.type === 'rock') {
      const rockGrad = ctx.createRadialGradient(-5, -5, 0, 0, 0, obstacle.radius);
      rockGrad.addColorStop(0, '#696969');
      rockGrad.addColorStop(1, '#2f4f4f');
      ctx.fillStyle = rockGrad;
      ctx.beginPath();
      ctx.moveTo(0, -obstacle.radius);
      ctx.lineTo(obstacle.radius, 0);
      ctx.lineTo(obstacle.radius * 0.7, obstacle.radius);
      ctx.lineTo(-obstacle.radius * 0.7, obstacle.radius);
      ctx.lineTo(-obstacle.radius, 0);
      ctx.closePath();
      ctx.fill();
    } else if (obstacle.type === 'seaweed') {
      ctx.strokeStyle = '#228b22';
      ctx.lineWidth = 4;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-10 + i * 10, obstacle.radius);
        const wave = Math.sin(Date.now() / 200 + i) * 5;
        ctx.quadraticCurveTo(-10 + i * 10 + wave, 0, -10 + i * 10, -obstacle.radius);
        ctx.stroke();
      }
    } else if (obstacle.type === 'seagull') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, obstacle.radius, obstacle.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-obstacle.radius, 0);
      ctx.lineTo(-obstacle.radius * 1.5, -5);
      ctx.lineTo(-obstacle.radius, 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(obstacle.radius, 0);
      ctx.lineTo(obstacle.radius * 1.5, -5);
      ctx.lineTo(obstacle.radius, 2);
      ctx.fill();
      ctx.fillStyle = '#ffa500';
      ctx.beginPath();
      ctx.moveTo(obstacle.radius * 0.8, 0);
      ctx.lineTo(obstacle.radius * 1.2, 3);
      ctx.lineTo(obstacle.radius * 0.5, 3);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }, []);

  const drawSurfer = useCallback((ctx: CanvasRenderingContext2D, surfer: { x: number; y: number; rotation: number; speed: number; isOnWave: boolean; isJumping: boolean; jumpHeight: number; currentTrick: string | null }, wave: { x: number; y: number; amplitude: number; frequency: number; phase: number }) => {
    ctx.save();
    ctx.translate(surfer.x, surfer.y - (surfer.isJumping ? surfer.jumpHeight : 0));

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(3, 3, 30, 8, surfer.rotation, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.rotate(surfer.rotation);

    const boardGrad = ctx.createLinearGradient(-25, 0, 25, 0);
    boardGrad.addColorStop(0, '#ff6b35');
    boardGrad.addColorStop(0.5, '#ffd700');
    boardGrad.addColorStop(1, '#ff6b35');
    ctx.fillStyle = boardGrad;
    ctx.beginPath();
    ctx.ellipse(0, 8, 28, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.save();
    if (surfer.isJumping) {
      ctx.rotate(Math.sin(Date.now() / 100) * 0.3);
    }

    ctx.fillStyle = '#ffd93d';
    ctx.beginPath();
    ctx.arc(0, -20, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff6b35';
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.lineTo(10, -8);
    ctx.lineTo(8, 10);
    ctx.lineTo(-8, 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.ellipse(0, -35, 14, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff6347';
    ctx.beginPath();
    ctx.moveTo(-12, -40);
    ctx.lineTo(12, -40);
    ctx.lineTo(8, -30);
    ctx.lineTo(-8, -30);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(-4, -22, 2, 0, Math.PI * 2);
    ctx.arc(4, -22, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-3, -23, 1, 0, Math.PI * 2);
    ctx.arc(5, -23, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (surfer.currentTrick) {
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 15;
      ctx.fillText(surfer.currentTrick, 0, -60);
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

  const drawScorePopups = useCallback((ctx: CanvasRenderingContext2D, tricks: { name: string; score: number; time: number }[]) => {
    const now = Date.now();
    let yOffset = 60;

    for (const trick of tricks.slice(-5)) {
      const age = now - trick.time;
      if (age < 3000) {
        ctx.save();
        ctx.globalAlpha = 1 - age / 3000;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
        ctx.fillText(`${trick.name} +${trick.score}`, CANVAS_WIDTH - 20, yOffset);
        ctx.restore();
        yOffset += 25;
      }
    }
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = engine.getState();

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawSky(ctx);
    drawOcean(ctx, state.waves);

    for (const obs of state.obstacles) {
      drawObstacle(ctx, obs);
    }

    const mainWave = state.waves.find(w => w.type === 'normal') || state.waves[0];
    if (mainWave) {
      drawSurfer(ctx, state.surfer, mainWave);
    }

    drawParticles(ctx, state.particles);
    drawScorePopups(ctx, state.tricks);

    if (state.message) {
      ctx.save();
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const isPositive = !state.message.includes('摔入');
      ctx.fillStyle = isPositive ? '#ffd700' : '#ff4444';
      ctx.shadowColor = isPositive ? '#ffd700' : '#ff4444';
      ctx.shadowBlur = 25;
      ctx.fillText(state.message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
      ctx.restore();
    }

    if (state.phase === 'wipeout') {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#4169e1';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.restore();
    }
  }, [engine, drawSky, drawOcean, drawObstacle, drawSurfer, drawParticles, drawScorePopups]);

  const gameLoop = useCallback(() => {
    engine.tick();
    const state = engine.getState();

    setScore(state.score);
    setCombo(state.combo);
    setDistance(Math.floor(state.distance));
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
    setCombo(0);
    setDistance(0);
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
              <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>距离</div>
              <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{distance}m</div>
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
                style={{ backgroundColor: 'rgba(15, 15, 26, 0.85)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-5xl font-bold mb-2"
                  style={{ color: NEON_COLORS.neonBlue, textShadow: `0 0 20px ${NEON_COLORS.neonBlue}` }}
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  冲浪
                </motion.div>
                <motion.div
                  className="text-lg mb-8 opacity-70"
                  style={{ color: NEON_COLORS.neonPink }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ delay: 0.3 }}
                >
                  Surfing - 乘风破浪
                </motion.div>

                <motion.button
                  onClick={startGame}
                  className="px-10 py-4 rounded-xl text-xl font-bold mb-6"
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.neonBlue}, ${NEON_COLORS.accent})`,
                    color: NEON_COLORS.white,
                    boxShadow: `0 0 25px ${NEON_COLORS.neonBlue}80`,
                  }}
                  whileHover={{ scale: 1.08, boxShadow: `0 0 40px ${NEON_COLORS.neonBlue}` }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  开始冲浪
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
                  <div>1-7 执行花式动作</div>
                </motion.div>

                <motion.div
                  className="mt-4 text-xs opacity-50 text-center"
                  style={{ color: NEON_COLORS.neonBlue }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: 0.9 }}
                >
                  <div>在浪上滑行获得分数</div>
                  <div>执行花式动作获得连击加分</div>
                  <div>避开礁石和海藻!</div>
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

                <motion.div
                  className="text-lg mb-2"
                  style={{ color: NEON_COLORS.neonBlue }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  滑行距离: {distance}m
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
                      backgroundColor: NEON_COLORS.neonBlue,
                      color: NEON_COLORS.white,
                      boxShadow: `0 0 20px ${NEON_COLORS.neonBlue}`,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    再来一次
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
          <div className="flex justify-center gap-4 text-sm flex-wrap" style={{ color: NEON_COLORS.gold }}>
            {trickList.map((trick, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1 rounded" style={{ background: 'rgba(108, 92, 231, 0.2)' }}>
                <kbd className="px-1 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(108, 92, 231, 0.4)', color: NEON_COLORS.white }}>{i + 1}</kbd>
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
