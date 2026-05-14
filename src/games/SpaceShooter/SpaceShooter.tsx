import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { SPACE_SHOOTER_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { SpaceShooterEngine, Player, Enemy, Bullet, PowerUp, Explosion } from './engine';
import { useNavigate } from 'react-router-dom';

const BG_GRADIENT = 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)';

export default function SpaceShooter() {
  const navigate = useNavigate();
  const [engine] = useState(() => new SpaceShooterEngine());
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [player, setPlayer] = useState<Player>(() => engine.getState().player);
  const [enemies, setEnemies] = useState<Enemy[]>(() => engine.getState().enemies);
  const [playerBullets, setPlayerBullets] = useState<Bullet[]>(() => engine.getState().playerBullets);
  const [powerUps, setPowerUps] = useState<PowerUp[]>(() => engine.getState().powerUps);
  const [explosions, setExplosions] = useState<Explosion[]>(() => engine.getState().explosions);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [bestScore, setBestScore] = useLocalStorage(STORAGE_KEYS.SPACE_SHOOTER, 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastShotRef = useRef(0);
  const { width, height } = engine.getCanvasSize();

  const handleScoreUpdate = useCallback(() => {}, []);

  const handleGameOver = useCallback(() => {}, []);

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setEnemies([...state.enemies]);
    setPlayerBullets([...state.playerBullets]);
    setPowerUps([...state.powerUps]);
    setExplosions([...state.explosions]);
    setScore(state.score);
    setLevel(state.level);
    setLives(state.lives);

    if (state.isGameOver && gameState === 'playing') {
      setGameState('gameover');
      if (state.score > bestScore) {
        setBestScore(state.score);
      }
    }
  }, [engine, gameState, bestScore, setBestScore]);

  useGameLoop({ callback: handleTick, delay: 16, enabled: gameState === 'playing' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#0f0f1a');
      gradient.addColorStop(0.5, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 60; i++) {
        const x = (Date.now() * 0.03 + i * 47) % (width + 100) - 50;
        const y = (i * 31 + Date.now() * 0.05) % height;
        const size = 0.5 + Math.random() * 1.5;
        const opacity = 0.2 + Math.random() * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }

      explosions.forEach(exp => {
        const progress = exp.frame / exp.maxFrames;
        const radius = progress * (exp.maxFrames * 1.5);
        const alpha = 1 - progress;

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 50, ${alpha * 0.5})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 100, 50, ${alpha * 0.7})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
        ctx.fill();
      });

      powerUps.forEach(p => {
        const colors = {
          speed: '#00ff88',
          shield: '#00d2ff',
          life: '#ff6b9d'
        };
        const icons = {
          speed: '⚡',
          shield: '🛡',
          life: '❤'
        };

        ctx.save();
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
        ctx.rotate(Date.now() / 500);

        ctx.beginPath();
        ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = `${colors[p.type]}33`;
        ctx.fill();
        ctx.strokeStyle = colors[p.type];
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        ctx.font = '14px Arial';
        ctx.fillText(icons[p.type], p.x + 3, p.y + p.height / 2 + 5);
      });

      playerBullets.forEach(b => {
        const bulletGradient = ctx.createLinearGradient(b.x, b.y + b.height, b.x, b.y);
        bulletGradient.addColorStop(0, '#ffff00');
        bulletGradient.addColorStop(0.5, '#ff8800');
        bulletGradient.addColorStop(1, '#ff4400');
        ctx.fillStyle = bulletGradient;
        ctx.fillRect(b.x, b.y, b.width, b.height);

        ctx.beginPath();
        ctx.arc(b.x + b.width / 2, b.y, b.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });

      enemies.forEach(e => {
        if (e.type === 'boss') {
          const bossGradient = ctx.createLinearGradient(e.x, e.y, e.x, e.y + e.height);
          bossGradient.addColorStop(0, '#ff4757');
          bossGradient.addColorStop(1, '#c0392b');
          ctx.fillStyle = bossGradient;

          ctx.beginPath();
          ctx.moveTo(e.x + e.width / 2, e.y);
          ctx.lineTo(e.x + e.width, e.y + e.height * 0.3);
          ctx.lineTo(e.x + e.width * 0.8, e.y + e.height);
          ctx.lineTo(e.x + e.width * 0.2, e.y + e.height);
          ctx.lineTo(e.x, e.y + e.height * 0.3);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(e.x + e.width * 0.3, e.y + e.height * 0.5, 8, 0, Math.PI * 2);
          ctx.arc(e.x + e.width * 0.7, e.y + e.height * 0.5, 8, 0, Math.PI * 2);
          ctx.fill();

          const healthBarWidth = e.width;
          const healthBarHeight = 6;
          const healthBarX = e.x;
          const healthBarY = e.y + e.height + 5;
          const healthPercent = e.health / e.maxHealth;

          ctx.fillStyle = '#333';
          ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
          ctx.fillStyle = healthPercent > 0.5 ? '#00ff88' : healthPercent > 0.25 ? '#ffaa00' : '#ff4444';
          ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
        } else {
          const enemyColors = {
            normal: '#ff6348',
            fast: '#ffa502',
            tank: '#9b59b6'
          };
          const color = enemyColors[e.type];

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(e.x + e.width / 2, e.y + e.height);
          ctx.lineTo(e.x + e.width, e.y);
          ctx.lineTo(e.x, e.y);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(e.x + e.width * 0.35, e.y + e.height * 0.4, 3, 0, Math.PI * 2);
          ctx.arc(e.x + e.width * 0.65, e.y + e.height * 0.4, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      const state = engine.getState();
      const p = state.player;

      if (gameState === 'playing') {
        const alpha = state.invincibleTime > 0 && Math.floor(state.invincibleTime / 5) % 2 === 0 ? 0.4 : 1;

        if (p.hasShield) {
          ctx.beginPath();
          ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width * 1.2, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 210, 255, ${alpha})`;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = `rgba(0, 210, 255, ${alpha * 0.15})`;
          ctx.fill();
        }

        ctx.globalAlpha = alpha;

        const shipGradient = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
        shipGradient.addColorStop(0, '#00d2ff');
        shipGradient.addColorStop(0.5, '#3a7bd5');
        shipGradient.addColorStop(1, '#667eea');
        ctx.fillStyle = shipGradient;

        ctx.beginPath();
        ctx.moveTo(p.x + p.width / 2, p.y);
        ctx.lineTo(p.x + p.width, p.y + p.height * 0.7);
        ctx.lineTo(p.x + p.width * 0.8, p.y + p.height);
        ctx.lineTo(p.x + p.width * 0.2, p.y + p.height);
        ctx.lineTo(p.x, p.y + p.height * 0.7);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x + p.width / 2, p.y + p.height * 0.4, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = p.hasSpeedBoost ? '#00ff88' : '#ff6b9d';
        ctx.beginPath();
        ctx.moveTo(p.x + p.width / 2, p.y + p.height);
        ctx.lineTo(p.x + p.width / 2 - 8, p.y + p.height + 15);
        ctx.lineTo(p.x + p.width / 2, p.y + p.height + 10);
        ctx.lineTo(p.x + p.width / 2 + 8, p.y + p.height + 15);
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 1;
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [engine, gameState, player, enemies, playerBullets, powerUps, explosions, width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      engine.setMousePosition(x, y);
    };

    const handleClick = () => {
      if (gameState === 'playing') {
        const now = Date.now();
        if (now - lastShotRef.current > 50) {
          engine.shoot();
          lastShotRef.current = now;
        }
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [engine, gameState, width, height]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'idle') {
          engine.start();
          setGameState('playing');
        } else if (gameState === 'gameover') {
          engine.reset();
          setGameState('idle');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [engine, gameState]);

  const handleStart = () => {
    engine.start();
    setGameState('playing');
  };

  const handleRestart = () => {
    engine.reset();
    setGameState('idle');
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[600px] px-4">
        <motion.button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{
            backgroundColor: 'rgba(26, 26, 46, 0.8)',
            color: '#00d2ff',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 10px rgba(0, 210, 255, 0.3)',
            border: '1px solid rgba(0, 210, 255, 0.3)'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>分数</div>
          <div className="text-3xl font-bold" style={{ color: '#ff6b9d' }}>{score}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>关卡</div>
          <div className="text-2xl font-bold" style={{ color: '#00ff88' }}>{level}</div>
        </div>

        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <motion.span
              key={i}
              className="text-xl"
              animate={{ scale: i < lives ? 1 : 0.7, opacity: i < lives ? 1 : 0.2 }}
            >
              🚀
            </motion.span>
          ))}
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>最高</div>
          <div className="text-xl font-bold" style={{ color: '#00d2ff' }}>{bestScore}</div>
        </div>
      </div>

      {gameState === 'playing' && (
        <div className="flex items-center gap-4 px-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(0, 255, 136, 0.3)', border: '1px solid rgba(0, 255, 136, 0.5)' }}>
            <span>⚡</span>
            <span style={{ color: '#00ff88' }}>{player.hasSpeedBoost ? 'ON' : 'OFF'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(0, 210, 255, 0.3)', border: '1px solid rgba(0, 210, 255, 0.5)' }}>
            <span>🛡</span>
            <span style={{ color: '#00d2ff' }}>{player.hasShield ? 'ON' : 'OFF'}</span>
          </div>
        </div>
      )}

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          boxShadow: '0 0 40px rgba(255, 107, 157, 0.3)',
          border: '2px solid rgba(255, 107, 157, 0.4)'
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ cursor: 'crosshair' }}
        />

        <AnimatePresence>
          {gameState === 'idle' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(15, 15, 26, 0.95)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-7xl mb-6"
                animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                🚀
              </motion.div>
              <div className="text-4xl font-bold mb-3" style={{ color: '#ffffff' }}>
                太空射击
              </div>
              <div className="text-lg mb-8" style={{ color: '#ffd700' }}>
                消灭入侵的外星敌人
              </div>
              <motion.button
                onClick={handleStart}
                className="px-10 py-4 rounded-xl text-xl font-bold mb-4"
                style={{
                  background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
                  color: '#ffffff',
                  boxShadow: '0 0 30px rgba(255, 107, 157, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开始游戏
              </motion.button>
              <div className="text-sm opacity-60" style={{ color: '#aaaaaa' }}>
                按空格键或点击开始
              </div>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(15, 15, 26, 0.95)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                💥
              </motion.div>
              <div className="text-5xl font-bold mb-4" style={{ color: '#ff6b9d' }}>
                游戏结束
              </div>
              <div className="text-3xl mb-2" style={{ color: '#ffd700' }}>
                得分: {score}
              </div>
              <div className="text-lg mb-2" style={{ color: '#00ff88' }}>
                到达关卡: {level}
              </div>
              {score >= bestScore && score > 0 && (
                <motion.div
                  className="text-xl mb-4"
                  style={{ color: '#4ecdc4' }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ type: 'spring' }}
                >
                  🎉 新纪录! 🎉
                </motion.div>
              )}
              <div className="text-xl mb-6" style={{ color: '#00d2ff' }}>
                最高: {bestScore}
              </div>
              <motion.button
                onClick={handleRestart}
                className="px-10 py-4 rounded-xl text-xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
                  color: '#ffffff',
                  boxShadow: '0 0 30px rgba(0, 210, 255, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                再来一局
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-center opacity-60 text-sm" style={{ color: '#ffd700' }}>
        <div>鼠标移动控制飞船 | 点击发射 | 空格键开始/重玩</div>
      </div>

      <div className="flex gap-6 mt-2 text-xs" style={{ color: '#aaaaaa' }}>
        <div className="flex items-center gap-1">
          <span style={{ color: '#00ff88' }}>⚡</span>
          <span>加速道具</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#00d2ff' }}>🛡</span>
          <span>护盾道具</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ff6b9d' }}>❤</span>
          <span>生命道具</span>
        </div>
      </div>
    </div>
  );
}
