import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { RAIDEN_ENHANCED_CONSTANTS } from '../../utils/raidenEnhancedConstants';
import { RaidenEnhancedEngine, Player, Enemy, Bullet, PowerUp, Explosion, Particle } from './engine';
import { useNavigate } from 'react-router-dom';

export default function RaidenEnhanced() {
  const navigate = useNavigate();
  const [engine] = useState(() => new RaidenEnhancedEngine());
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [player, setPlayer] = useState<Player>(() => engine.getState().player);
  const [enemies, setEnemies] = useState<Enemy[]>(() => engine.getState().enemies);
  const [playerBullets, setPlayerBullets] = useState<Bullet[]>(() => engine.getState().playerBullets);
  const [enemyBullets, setEnemyBullets] = useState<Bullet[]>(() => engine.getState().enemyBullets);
  const [powerUps, setPowerUps] = useState<PowerUp[]>(() => engine.getState().powerUps);
  const [explosions, setExplosions] = useState<Explosion[]>(() => engine.getState().explosions);
  const [particles, setParticles] = useState<Particle[]>(() => engine.getState().particles);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [bestScore, setBestScore] = useLocalStorage('raidenEnhanced_highscore', 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const { width, height } = engine.getCanvasSize();

  const handleTick = useCallback(() => {
    keysRef.current.forEach(key => {
      engine.setKeyPressed(key, true);
    });
    engine.tick();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setEnemies([...state.enemies]);
    setPlayerBullets([...state.playerBullets]);
    setEnemyBullets([...state.enemyBullets]);
    setPowerUps([...state.powerUps]);
    setExplosions([...state.explosions]);
    setParticles([...state.particles]);
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
      gradient.addColorStop(0, '#0a0a2e');
      gradient.addColorStop(0.5, '#1a1a3e');
      gradient.addColorStop(1, '#0f0f1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 60; i++) {
        const x = (Date.now() * 0.02 + i * 41) % (width + 50) - 25;
        const y = (i * 37 + Date.now() * 0.04) % height;
        const size = 0.5 + Math.random() * 1.5;
        const opacity = 0.2 + Math.random() * 0.4;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }

      explosions.forEach(exp => {
        const progress = exp.frame / exp.maxFrames;
        const radius = progress * (exp.size * 1.5);
        const alpha = 1 - progress;

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 50, ${alpha * 0.4})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 100, 50, ${alpha * 0.6})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
        ctx.fill();
      });

      particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
      });

      powerUps.forEach(p => {
        const colors: Record<string, string> = {
          power: '#ff00ff',
          speed: '#ffd700',
          shield: '#00d2ff',
          bomb: '#ff4444',
          missile: '#00ff88'
        };
        const icons: Record<string, string> = {
          power: 'P',
          speed: 'S',
          shield: 'O',
          bomb: 'B',
          missile: 'M'
        };

        const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;

        ctx.save();
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
        ctx.rotate(Date.now() / 600);

        ctx.beginPath();
        ctx.arc(0, 0, (p.width / 2) * pulse, 0, Math.PI * 2);
        ctx.fillStyle = colors[p.type] + '44';
        ctx.fill();
        ctx.strokeStyle = colors[p.type];
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = colors[p.type];
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icons[p.type], p.x + p.width / 2, p.y + p.height / 2);
      });

      enemyBullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.width / 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });

      playerBullets.forEach(b => {
        const bulletGradient = ctx.createLinearGradient(b.x, b.y + b.height, b.x, b.y);
        bulletGradient.addColorStop(0, b.color);
        bulletGradient.addColorStop(1, '#ffffff');
        ctx.fillStyle = bulletGradient;
        ctx.fillRect(b.x, b.y, b.width, b.height);
      });

      enemies.forEach(e => {
        const enemyColors: Record<string, string> = {
          scout: '#ff6348',
          fighter: '#ffa502',
          bomber: '#9b59b6',
          elite: '#e74c3c',
          boss: '#c0392b'
        };

        if (e.type === 'boss') {
          const bossGradient = ctx.createLinearGradient(e.x, e.y, e.x, e.y + e.height);
          bossGradient.addColorStop(0, '#c0392b');
          bossGradient.addColorStop(1, '#8e44ad');
          ctx.fillStyle = bossGradient;

          ctx.beginPath();
          ctx.moveTo(e.x + e.width / 2, e.y);
          ctx.lineTo(e.x + e.width, e.y + e.height * 0.3);
          ctx.lineTo(e.x + e.width * 0.85, e.y + e.height);
          ctx.lineTo(e.x + e.width * 0.15, e.y + e.height);
          ctx.lineTo(e.x, e.y + e.height * 0.3);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(e.x + e.width * 0.3, e.y + e.height * 0.5, 10, 0, Math.PI * 2);
          ctx.arc(e.x + e.width * 0.7, e.y + e.height * 0.5, 10, 0, Math.PI * 2);
          ctx.fill();

          const healthBarWidth = e.width;
          const healthBarHeight = 8;
          const healthPercent = e.health / e.maxHealth;

          ctx.fillStyle = '#333';
          ctx.fillRect(e.x, e.y - 15, healthBarWidth, healthBarHeight);
          ctx.fillStyle = healthPercent > 0.5 ? '#00ff88' : healthPercent > 0.25 ? '#ffaa00' : '#ff4444';
          ctx.fillRect(e.x, e.y - 15, healthBarWidth * healthPercent, healthBarHeight);
        } else {
          ctx.save();
          ctx.translate(e.x + e.width / 2, e.y + e.height / 2);
          ctx.rotate(e.angle);

          ctx.fillStyle = enemyColors[e.type];
          ctx.beginPath();
          ctx.moveTo(0, -e.height / 2);
          ctx.lineTo(e.width / 2, e.height / 2);
          ctx.lineTo(-e.width / 2, e.height / 2);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      });

      const state = engine.getState();
      const p = state.player;

      const alpha = state.player.invincibleFrames > 0 && Math.floor(state.player.invincibleFrames / 4) % 2 === 0 ? 0.4 : 1;
      ctx.globalAlpha = alpha;

      if (p.hasShield) {
        ctx.beginPath();
        ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width * 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.7)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 210, 255, 0.1)';
        ctx.fill();
      }

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
      ctx.arc(p.x + p.width / 2, p.y + p.height * 0.35, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = p.hasShield ? '#00d2ff' : '#ff6b9d';
      ctx.beginPath();
      ctx.moveTo(p.x + p.width / 2, p.y + p.height);
      ctx.lineTo(p.x + p.width / 2 - 8, p.y + p.height + 15);
      ctx.lineTo(p.x + p.width / 2, p.y + p.height + 10);
      ctx.lineTo(p.x + p.width / 2 + 8, p.y + p.height + 15);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 1;

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [engine, gameState, player, enemies, playerBullets, enemyBullets, powerUps, explosions, particles, width, height]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.add(key);

      if (e.key === ' ') {
        e.preventDefault();
        if (gameState === 'playing') {
          engine.useBomb();
        }
      }

      if (gameState === 'idle' || gameState === 'gameover') {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (gameState === 'idle') {
            engine.start();
            setGameState('playing');
          } else {
            engine.reset();
            setGameState('idle');
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.delete(key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
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
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>等级</div>
          <div className="text-2xl font-bold" style={{ color: '#00ff88' }}>{level}</div>
        </div>

        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <motion.span
              key={i}
              className="text-xl"
              animate={{ scale: i < lives ? 1 : 0.7, opacity: i < lives ? 1 : 0.2 }}
            >
              ✈️
            </motion.span>
          ))}
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(255, 68, 68, 0.3)', border: '1px solid rgba(255, 68, 68, 0.5)' }}>
          <span style={{ color: '#ff4444' }}>💣</span>
          <span style={{ color: '#ff4444' }}>{player.bombs}</span>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>最高</div>
          <div className="text-xl font-bold" style={{ color: '#00d2ff' }}>{bestScore}</div>
        </div>
      </div>

      {gameState === 'playing' && (
        <div className="flex items-center gap-4 px-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(255, 0, 255, 0.3)', border: '1px solid rgba(255, 0, 255, 0.5)' }}>
            <span style={{ color: '#ff00ff' }}>P</span>
            <span style={{ color: '#ff00ff' }}>Lv.{player.powerLevel}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(0, 210, 255, 0.3)', border: '1px solid rgba(0, 210, 255, 0.5)' }}>
            <span style={{ color: '#00d2ff' }}>O</span>
            <span style={{ color: '#00d2ff' }}>{player.hasShield ? 'ON' : 'OFF'}</span>
          </div>
        </div>
      )}

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          boxShadow: '0 0 40px rgba(0, 210, 255, 0.3)',
          border: '2px solid rgba(0, 210, 255, 0.4)'
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
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✈️
              </motion.div>
              <div className="text-4xl font-bold mb-3" style={{ color: '#ffffff' }}>
                雷电增强
              </div>
              <div className="text-lg mb-2" style={{ color: '#ffd700' }}>
                经典街机弹幕射击
              </div>
              <div className="text-sm mb-8 opacity-70" style={{ color: '#aaa' }}>
                收集道具升级武器 | 空格键使用炸弹
              </div>
              <motion.button
                onClick={handleStart}
                className="px-10 py-4 rounded-xl text-xl font-bold mb-4"
                style={{
                  background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
                  color: '#ffffff',
                  boxShadow: '0 0 30px rgba(0, 210, 255, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开始游戏
              </motion.button>
              <div className="text-sm opacity-60" style={{ color: '#aaaaaa' }}>
                WASD移动 | 空格炸弹 | 空格/回车开始
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
                到达等级: {level}
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
                  background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
                  color: '#ffffff',
                  boxShadow: '0 0 30px rgba(255, 107, 157, 0.5)'
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
        <div>WASD移动 | 空格键使用炸弹清屏</div>
      </div>

      <div className="flex gap-6 mt-2 text-xs" style={{ color: '#aaaaaa' }}>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ff00ff' }}>P</span>
          <span>火力升级</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ffd700' }}>S</span>
          <span>速度提升</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#00d2ff' }}>O</span>
          <span>护盾</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ff4444' }}>B</span>
          <span>炸弹</span>
        </div>
      </div>
    </div>
  );
}
