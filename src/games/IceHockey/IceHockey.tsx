import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { IceHockeyEngine } from './engine';

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
  red: '#ff4444',
  blue: '#4444ff',
};

export default function IceHockey() {
  const navigate = useNavigate();
  const [engine] = useState(() => new IceHockeyEngine());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());

  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [period, setPeriod] = useState(1);
  const [message, setMessage] = useState('');
  const [highScore, setHighScore] = useLocalStorage('icehockey_highscore', 0);

  const { width, height } = engine.getCanvasSize();

  const drawRink = useCallback((ctx: CanvasRenderingContext2D) => {
    const padding = 30;
    const rinkWidth = CANVAS_WIDTH - padding * 2;
    const rinkHeight = CANVAS_HEIGHT - padding * 2;

    const rinkGrad = ctx.createLinearGradient(padding, padding, padding, CANVAS_HEIGHT - padding);
    rinkGrad.addColorStop(0, '#e8f4f8');
    rinkGrad.addColorStop(0.5, '#f0f8ff');
    rinkGrad.addColorStop(1, '#e0f0f8');
    ctx.fillStyle = rinkGrad;
    ctx.fillRect(padding, padding, rinkWidth, rinkHeight);

    ctx.strokeStyle = 'rgba(100, 100, 100, 0.8)';
    ctx.lineWidth = 3;
    ctx.strokeRect(padding, padding, rinkWidth, rinkHeight);

    ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, padding);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - padding);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 45, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(padding + 60, CANVAS_HEIGHT / 2, 45, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH - padding - 60, CANVAS_HEIGHT / 2, 45, Math.PI / 2, -Math.PI / 2);
    ctx.stroke();

    const goalWidth = 10;
    const goalHeight = 100;
    const goalY = (CANVAS_HEIGHT - goalHeight) / 2;

    ctx.fillStyle = '#ff4444';
    ctx.fillRect(padding - 5, goalY, goalWidth + 5, goalHeight);
    ctx.strokeStyle = '#cc0000';
    ctx.lineWidth = 3;
    ctx.strokeRect(padding - 5, goalY, goalWidth + 5, goalHeight);

    ctx.fillStyle = '#4444ff';
    ctx.fillRect(CANVAS_WIDTH - padding - goalWidth, goalY, goalWidth + 5, goalHeight);
    ctx.strokeStyle = '#0000cc';
    ctx.lineWidth = 3;
    ctx.strokeRect(CANVAS_WIDTH - padding - goalWidth, goalY, goalWidth + 5, goalHeight);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, padding);
    ctx.lineTo(CANVAS_WIDTH / 2, padding + 50);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - padding);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - padding - 50);
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, player: { x: number; y: number; radius: number; team: 'red' | 'blue'; hasPuck: boolean }, isPlayer1: boolean) => {
    ctx.save();
    ctx.translate(player.x, player.y);

    const baseColor = isPlayer1 ? '#ff4444' : '#4444ff';
    const highlightColor = isPlayer1 ? '#ff8888' : '#8888ff';

    const playerGrad = ctx.createRadialGradient(-player.radius * 0.3, -player.radius * 0.3, 0, 0, 0, player.radius);
    playerGrad.addColorStop(0, highlightColor);
    playerGrad.addColorStop(1, baseColor);

    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isPlayer1 ? '#cc0000' : '#0000cc';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isPlayer1 ? '1' : '2', 0, 0);

    if (player.hasPuck) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, player.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(-player.radius * 0.3, -player.radius * 0.3, player.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, []);

  const drawPuck = useCallback((ctx: CanvasRenderingContext2D, puck: { x: number; y: number; radius: number; isHeld: boolean }) => {
    ctx.save();
    ctx.translate(puck.x, puck.y);

    if (!puck.isHeld) {
      const puckShadow = ctx.createRadialGradient(2, 2, 0, 0, 0, puck.radius * 1.5);
      puckShadow.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
      puckShadow.addColorStop(1, 'transparent');
      ctx.fillStyle = puckShadow;
      ctx.beginPath();
      ctx.arc(0, 0, puck.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const puckGrad = ctx.createRadialGradient(-puck.radius * 0.3, -puck.radius * 0.3, 0, 0, 0, puck.radius);
    puckGrad.addColorStop(0, '#666666');
    puckGrad.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = puckGrad;
    ctx.beginPath();
    ctx.arc(0, 0, puck.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(-puck.radius * 0.3, -puck.radius * 0.3, puck.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, []);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D, particles: { x: number; y: number; life: number; color: string; size: number }[]) => {
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

  const drawGoalFlash = useCallback((ctx: CanvasRenderingContext2D, timer: number) => {
    if (timer > 0) {
      ctx.save();
      ctx.globalAlpha = (timer / 120) * 0.3;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.restore();
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

    drawRink(ctx);
    drawPuck(ctx, state.puck);
    drawPlayer(ctx, state.player1, true);
    drawPlayer(ctx, state.player2, false);
    drawParticles(ctx, state.particles);
    drawGoalFlash(ctx, state.goalFlashTimer);

    if (state.message && state.phase !== 'gameover') {
      ctx.save();
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 20;
      ctx.fillText(state.message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.restore();
    }
  }, [engine, drawRink, drawPuck, drawPlayer, drawParticles, drawGoalFlash]);

  const gameLoop = useCallback(() => {
    if (keysRef.current.size > 0) {
      let vx = 0;
      let vy = 0;

      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) vx -= 1;
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) vx += 1;
      if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) vy -= 1;
      if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) vy += 1;

      engine.setPlayer1Velocity(vx * 6, vy * 6);
    }

    engine.tick();
    const state = engine.getState();

    setPlayer1Score(state.player1Score);
    setPlayer2Score(state.player2Score);
    setPeriod(state.period);
    setMessage(state.message);

    render();

    if (state.phase === 'gameover') {
      setGameStatus('gameover');
      const maxScore = Math.max(state.player1Score, state.player2Score);
      if (maxScore > highScore) {
        setHighScore(maxScore);
      }
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [engine, render, highScore, setHighScore]);

  const startGame = useCallback(() => {
    engine.reset();
    setPlayer1Score(0);
    setPlayer2Score(0);
    setPeriod(1);
    setMessage('点击开始');
    setGameStatus('playing');
    engine.start();
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
      e.preventDefault();
      keysRef.current.add(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);

      if (e.key === ' ' && gameStatus === 'playing') {
        engine.player1Shoot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine, gameStatus]);

  const handleCanvasClick = useCallback(() => {
    if (gameStatus === 'playing') {
      engine.player1Shoot();
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
            <div className="text-center" style={{ backgroundColor: 'rgba(26, 26, 46, 0.8)', padding: '8px 16px', borderRadius: '12px', border: `2px solid ${NEON_COLORS.red}` }}>
              <div className="text-xs opacity-70" style={{ color: NEON_COLORS.red }}>红队 (你)</div>
              <motion.div
                className="text-3xl font-bold"
                style={{ color: NEON_COLORS.red }}
                key={player1Score}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.15 }}
              >
                {player1Score}
              </motion.div>
            </div>

            <div className="text-center" style={{ backgroundColor: 'rgba(26, 26, 46, 0.8)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
              <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>第 {period} 节</div>
              <div className="text-xl font-bold" style={{ color: NEON_COLORS.gold }}>/ 3</div>
            </div>

            <div className="text-center" style={{ backgroundColor: 'rgba(26, 26, 46, 0.8)', padding: '8px 16px', borderRadius: '12px', border: `2px solid ${NEON_COLORS.blue}` }}>
              <div className="text-xs opacity-70" style={{ color: NEON_COLORS.blue }}>蓝队 (AI)</div>
              <div className="text-3xl font-bold" style={{ color: NEON_COLORS.blue }}>{player2Score}</div>
            </div>
          </div>

          <div className="text-center" style={{ backgroundColor: 'rgba(26, 26, 46, 0.8)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>最高分</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.gold }}>{highScore}</div>
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
            style={{ display: 'block', cursor: gameStatus === 'playing' ? 'pointer' : 'default' }}
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
                  style={{ color: NEON_COLORS.neonBlue, textShadow: `0 0 20px ${NEON_COLORS.neonBlue}` }}
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  冰上曲棍球
                </motion.div>
                <motion.div
                  className="text-lg mb-8 opacity-70"
                  style={{ color: NEON_COLORS.neonPink }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ delay: 0.3 }}
                >
                  Ice Hockey - 冰球对战
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
                  开始比赛
                </motion.button>

                <motion.div
                  className="text-sm opacity-60 text-center leading-6"
                  style={{ color: NEON_COLORS.gold }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ delay: 0.7 }}
                >
                  <div>← → ↑ ↓ 或 WASD 控制球员移动</div>
                  <div>空格键 或 点击屏幕 射门</div>
                  <div>共3节比赛，得分多者获胜</div>
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
                  {message || '比赛结束'}
                </motion.div>

                <motion.div
                  className="text-2xl mb-2"
                  style={{ color: NEON_COLORS.gold }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  红队 {player1Score} - {player2Score} 蓝队
                </motion.div>

                {(player1Score > highScore - (highScore - player2Score) || player2Score > highScore - (highScore - player1Score)) && player1Score > 0 && (
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
              <kbd className="px-2 py-1 rounded text-xs font-mono" style={{ background: 'rgba(108, 92, 231, 0.3)', color: NEON_COLORS.white, border: '1px solid rgba(108, 92, 231, 0.5)' }}>WASD</kbd>
              <span>移动球员</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded text-xs font-mono" style={{ background: 'rgba(108, 92, 231, 0.3)', color: NEON_COLORS.white, border: '1px solid rgba(108, 92, 231, 0.5)' }}>空格</kbd>
              <span>射门</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded text-xs font-mono" style={{ background: 'rgba(108, 92, 231, 0.3)', color: NEON_COLORS.white, border: '1px solid rgba(108, 92, 231, 0.5)' }}>点击</kbd>
              <span>射门</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
