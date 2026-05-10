import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { SPACE_BULLET_CONSTANTS } from '../../utils/spaceBulletConstants';
import { SpaceBulletEngine, Player, Enemy, Bullet, PowerUp, Star, Explosion, Particle } from './engine';
import { useNavigate } from 'react-router-dom';

export default function SpaceBullet() {
  const navigate = useNavigate();
  const [engine] = useState(() => new SpaceBulletEngine());
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [player, setPlayer] = useState<Player>(() => engine.getState().player);
  const [enemies, setEnemies] = useState<Enemy[]>(() => engine.getState().enemies);
  const [playerBullets, setPlayerBullets] = useState<Bullet[]>(() => engine.getState().playerBullets);
  const [enemyBullets, setEnemyBullets] = useState<Bullet[]>(() => engine.getState().enemyBullets);
  const [powerUps, setPowerUps] = useState<PowerUp[]>(() => engine.getState().powerUps);
  const [stars, setStars] = useState<Star[]>(() => engine.getState().stars);
  const [explosions, setExplosions] = useState<Explosion[]>(() => engine.getState().explosions);
  const [particles, setParticles] = useState<Particle[]>(() => engine.getState().particles);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [bestScore, setBestScore] = useLocalStorage('spaceBullet_highscore', 0);
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
    setStars([...state.stars]);
    setExplosions([...state.explosions]);
    setParticles([...state.particles]);
    setScore(state.score);
    setLevel(state.level);

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
      ctx.fillStyle = '#000015';
      ctx.fillRect(0, 0, width, height);

      const state = engine.getState();

      state.stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.fill();
      });

      state.particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
      });

      state.explosions.forEach(exp => {
        const progress = exp.frame / exp.maxFrames;
        const radius = progress * exp.size;
        const alpha = 1 - progress;

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 50, ${alpha * 0.4})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 100, 50, ${alpha * 0.6})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
        ctx.fill();
      });

      state.powerUps.forEach(p => {
        const colors: Record<string, string> = {
          laser: '#00ffff',
          spread: '#ff00ff',
          shield: '#00d2ff',
          homing: '#ffff00',
          rapid: '#ff6b6b'
        };
        const icons: Record<string, string> = {
          laser: '|',
          spread: 'V',
          shield: 'O',
          homing: '*',
          rapid: '>'
        };

        const pulse = Math.sin(Date.now() / 150) * 0.2 + 0.8;

        ctx.save();
        ctx.translate(p.x + p.size / 2, p.y + p.size / 2);
        ctx.rotate(Date.now() / 400);

        ctx.beginPath();
        ctx.arc(0, 0, (p.size / 2) * pulse, 0, Math.PI * 2);
        ctx.fillStyle = colors[p.type] + '44';
        ctx.fill();
        ctx.strokeStyle = colors[p.type];
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = colors[p.type];
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icons[p.type], p.x + p.size / 2, p.y + p.size / 2);
      });

      state.enemyBullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size / 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });

      state.playerBullets.forEach(b => {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);

        if (b.type === 'homing') {
          ctx.beginPath();
          ctx.arc(0, 0, b.size, 0, Math.PI * 2);
          ctx.fillStyle = b.color;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(0, 0, b.size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        } else if (b.type === 'spread') {
          ctx.beginPath();
          ctx.ellipse(0, 0, b.size * 1.5, b.size / 2, 0, 0, Math.PI * 2);
          ctx.fillStyle = b.color;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.ellipse(0, 0, b.size * 2, b.size / 2, 0, 0, Math.PI * 2);
          ctx.fillStyle = b.color;
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(b.size, 0, b.size / 2, b.size / 3, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }

        ctx.restore();
      });

      state.enemies.forEach(e => {
        const enemyColor = e.type === 'fighter' ? '#ff6348' :
                          e.type === 'cruiser' ? '#ffa502' :
                          e.type === 'bomber' ? '#9b59b6' :
                          e.type === 'elite' ? '#e74c3c' : '#c0392b';

        ctx.save();
        ctx.translate(e.x, e.y);

        ctx.fillStyle = enemyColor;
        ctx.beginPath();
        ctx.moveTo(0, -e.size / 2);
        ctx.lineTo(e.size / 2, e.size / 2);
        ctx.lineTo(0, e.size / 3);
        ctx.lineTo(-e.size / 2, e.size / 2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-e.size / 6, -e.size / 8, e.size / 10, 0, Math.PI * 2);
        ctx.arc(e.size / 6, -e.size / 8, e.size / 10, 0, Math.PI * 2);
        ctx.fill();

        if (e.health < e.maxHealth) {
          const healthPercent = e.health / e.maxHealth;
          ctx.fillStyle = '#333';
          ctx.fillRect(-e.size / 2, -e.size / 2 - 8, e.size, 4);
          ctx.fillStyle = '#00ff88';
          ctx.fillRect(-e.size / 2, -e.size / 2 - 8, e.size * healthPercent, 4);
        }

        ctx.restore();
      });

      const p = state.player;

      const alpha = p.invincibleFrames > 0 && Math.floor(p.invincibleFrames / 4) % 2 === 0 ? 0.4 : 1;
      ctx.globalAlpha = alpha;

      if (p.hasShield) {
        for (let i = 0; i < p.shieldHealth; i++) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.3 + i * 5, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 210, 255, ${0.5 - i * 0.1})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      const weaponColor = p.weaponType === 'laser' ? '#00ffff' :
                         p.weaponType === 'spread' ? '#ff00ff' :
                         p.weaponType === 'homing' ? '#ffff00' : '#ff6b6b';

      const shipGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      shipGradient.addColorStop(0, weaponColor);
      shipGradient.addColorStop(1, '#1a1a3e');
      ctx.fillStyle = shipGradient;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y - p.size / 2);
      ctx.lineTo(p.x - p.size / 2, p.y + p.size / 2);
      ctx.lineTo(p.x - p.size / 4, p.y + p.size / 3);
      ctx.lineTo(p.x, p.y + p.size / 2);
      ctx.lineTo(p.x + p.size / 4, p.y + p.size / 3);
      ctx.lineTo(p.x + p.size / 2, p.y + p.size / 2);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = weaponColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y - p.size / 6, p.size / 6, 0, Math.PI * 2);
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
  }, [engine, gameState, width, height]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.add(key);

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
            color: '#ff6b9d',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 10px rgba(255, 107, 157, 0.3)',
            border: '1px solid rgba(255, 107, 157, 0.3)'
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

        <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(0, 255, 255, 0.3)', border: '1px solid rgba(0, 255, 255, 0.5)' }}>
          <span style={{ color: '#00ffff' }}>
            {player.weaponType === 'laser' ? '|' : player.weaponType === 'spread' ? 'V' : player.weaponType === 'homing' ? '*' : player.weaponType === 'rapid' ? '>' : '~'}
          </span>
          <span style={{ color: '#00ffff' }}>Lv.{player.weaponLevel}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(0, 210, 255, 0.3)', border: '1px solid rgba(0, 210, 255, 0.5)' }}>
          <span style={{ color: '#00d2ff' }}>O</span>
          <span style={{ color: '#00d2ff' }}>{player.hasShield ? `${player.shieldHealth}HP` : 'OFF'}</span>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>最高</div>
          <div className="text-xl font-bold" style={{ color: '#00d2ff' }}>{bestScore}</div>
        </div>
      </div>

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
              style={{ backgroundColor: 'rgba(0, 0, 20, 0.95)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-7xl mb-6"
                animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🚀
              </motion.div>
              <div className="text-4xl font-bold mb-3" style={{ color: '#ffffff' }}>
                太空弹幕
              </div>
              <div className="text-lg mb-2" style={{ color: '#ffd700' }}>
                星战弹幕射击
              </div>
              <div className="text-sm mb-8 opacity-70" style={{ color: '#aaa' }}>
                收集道具切换武器类型
              </div>
              <motion.button
                onClick={handleStart}
                className="px-10 py-4 rounded-xl text-xl font-bold mb-4"
                style={{
                  background: 'linear-gradient(135deg, #ff6b9d 0%, #a855f7 100%)',
                  color: '#ffffff',
                  boxShadow: '0 0 30px rgba(255, 107, 157, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开始游戏
              </motion.button>
              <div className="text-sm opacity-60" style={{ color: '#aaaaaa' }}>
                WASD移动 | 自动射击 | 空格/回车开始
              </div>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(0, 0, 20, 0.95)', backdropFilter: 'blur(8px)' }}
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
                等级: {level}
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
                  background: 'linear-gradient(135deg, #00ffff 0%, #ff00ff 100%)',
                  color: '#000015',
                  boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)'
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
        <div>WASD移动 | 自动射击</div>
      </div>

      <div className="flex gap-6 mt-2 text-xs" style={{ color: '#aaaaaa' }}>
        <div className="flex items-center gap-1">
          <span style={{ color: '#00ffff' }}>|</span>
          <span>激光</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ff00ff' }}>V</span>
          <span>散弹</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ffff00' }}>*</span>
          <span>追踪</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ff6b6b' }}>{'>'}</span>
          <span>速射</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#00d2ff' }}>O</span>
          <span>护盾</span>
        </div>
      </div>
    </div>
  );
}
