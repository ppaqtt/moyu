import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { WW2AIRWAR_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { WW2AirwarEngine, Player, Enemy, Bullet, Explosion } from './engine';

const BG_GRADIENT = 'linear-gradient(135deg, #1a0a0a 0%, #2d1810 50%, #1a1a0a 100%)';

export default function WW2Airwar() {
  const navigate = useNavigate();
  const [engine] = useState(() => new WW2AirwarEngine());
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [player, setPlayer] = useState<Player>(() => engine.getState().player);
  const [enemies, setEnemies] = useState<Enemy[]>(() => engine.getState().enemies);
  const [playerBullets, setPlayerBullets] = useState<Bullet[]>(() => engine.getState().playerBullets);
  const [enemyBullets, setEnemyBullets] = useState<Bullet[]>(() => engine.getState().enemyBullets);
  const [explosions, setExplosions] = useState<Explosion[]>(() => engine.getState().explosions);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [bestScore, setBestScore] = useLocalStorage(STORAGE_KEYS.WW2_AIRWAR, 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const lastShotRef = useRef(0);
  const { width, height } = engine.getCanvasSize();

  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setEnemies([...state.enemies]);
    setPlayerBullets([...state.playerBullets]);
    setEnemyBullets([...state.enemyBullets]);
    setExplosions([...state.explosions]);
    setScore(state.score);
    setLives(state.lives);
    setWave(state.wave);

    if (state.isGameOver && gameState === 'playing') {
      setGameState('gameover');
      if (state.score > bestScore) {
        setBestScore(state.score);
      }
    }
  }, [engine, bestScore, setBestScore, gameState]);

  useGameLoop({ callback: handleTick, delay: 16, enabled: gameState === 'playing' });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      keysRef.current.add(e.key);
      engine.setKey(e.key, true);

      if (e.key === ' ') {
        if (gameState === 'idle') {
          engine.start();
          setGameState('playing');
        } else if (gameState === 'gameover') {
          engine.reset();
          setGameState('idle');
        }
      }

      if (gameState === 'playing') {
        const now = Date.now();
        if (now - lastShotRef.current > 150) {
          engine.shoot();
          lastShotRef.current = now;
        }

        if (e.key === 'm' || e.key === 'M') {
          engine.useMissile();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
      engine.setKey(e.key, false);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      engine.setMousePosition(x, y);
    };

    const handleMouseDown = () => {
      if (gameState === 'playing') {
        engine.shoot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [engine, gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#1a0a0a');
      gradient.addColorStop(0.5, '#2d1810');
      gradient.addColorStop(1, '#1a1a0a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 100; i++) {
        const x = (Date.now() * 0.01 + i * 30) % (width + 50) - 25;
        const y = (i * 47) % height;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 100, ${0.3 + Math.random() * 0.3})`;
        ctx.fill();
      }

      explosions.forEach(e => {
        const progress = e.frame / e.maxFrames;
        const alpha = 1 - progress;

        const explosionGradient = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius * (1 + progress * 0.5));
        explosionGradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
        explosionGradient.addColorStop(0.3, `rgba(255, 150, 50, ${alpha})`);
        explosionGradient.addColorStop(0.7, `rgba(255, 80, 20, ${alpha * 0.7})`);
        explosionGradient.addColorStop(1, `rgba(100, 30, 0, 0)`);

        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * (1 + progress * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = explosionGradient;
        ctx.fill();
      });

      playerBullets.forEach(b => {
        const bulletGradient = ctx.createLinearGradient(b.x, b.y + 10, b.x, b.y - 10);
        bulletGradient.addColorStop(0, '#ffaa00');
        bulletGradient.addColorStop(1, '#ffdd00');
        ctx.fillStyle = bulletGradient;
        ctx.fillRect(b.x - 2, b.y - 8, 4, 16);
      });

      enemyBullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4444';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffaaaa';
        ctx.fill();
      });

      enemies.forEach(e => {
        const color = e.type === 'bomber' ? '#8B4513' : e.type === 'ace' ? '#ff6600' : '#556B2F';

        ctx.save();
        ctx.translate(e.x + e.width / 2, e.y + e.height / 2);
        if (e.vx < 0) ctx.scale(-1, 1);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-e.width / 2, 0);
        ctx.lineTo(-e.width / 4, -e.height / 2);
        ctx.lineTo(e.width / 4, -e.height / 2);
        ctx.lineTo(e.width / 2, 0);
        ctx.lineTo(e.width / 4, e.height / 2);
        ctx.lineTo(-e.width / 4, e.height / 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.fillRect(-5, -3, 10, 6);

        ctx.restore();

        if (e.health < e.maxHealth) {
          const barWidth = e.width;
          const barHeight = 4;
          ctx.fillStyle = '#333';
          ctx.fillRect(e.x, e.y - 8, barWidth, barHeight);
          ctx.fillStyle = '#ff4444';
          ctx.fillRect(e.x, e.y - 8, barWidth * (e.health / e.maxHealth), barHeight);
        }
      });

      if (gameState === 'playing') {
        const state = engine.getState();
        const p = state.player;
        const alpha = state.player.invincibleTime > 0 && Math.floor(state.player.invincibleTime / 5) % 2 === 0 ? 0.5 : 1;

        ctx.globalAlpha = alpha;

        if (p.hasShield) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 30, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = 'rgba(100, 200, 255, 0.2)';
          ctx.fill();
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle + Math.PI / 2);

        const planeGradient = ctx.createLinearGradient(0, -PLAYER_HEIGHT / 2, 0, PLAYER_HEIGHT / 2);
        planeGradient.addColorStop(0, '#3d5c3d');
        planeGradient.addColorStop(1, '#2d4a2d');
        ctx.fillStyle = planeGradient;

        ctx.beginPath();
        ctx.moveTo(0, -PLAYER_HEIGHT / 2);
        ctx.lineTo(PLAYER_WIDTH / 2, PLAYER_HEIGHT / 2);
        ctx.lineTo(PLAYER_WIDTH / 4, PLAYER_HEIGHT / 3);
        ctx.lineTo(-PLAYER_WIDTH / 4, PLAYER_HEIGHT / 3);
        ctx.lineTo(-PLAYER_WIDTH / 2, PLAYER_HEIGHT / 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#4a6b4a';
        ctx.fillRect(-PLAYER_WIDTH / 4, 0, PLAYER_WIDTH / 2, PLAYER_HEIGHT / 2);

        ctx.restore();
        ctx.globalAlpha = 1;
      }

      requestAnimationFrame(render);
    };

    render();
  }, [engine, gameState, player, enemies, playerBullets, enemyBullets, explosions, width, height]);

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
      <div className="flex items-center justify-between w-full max-w-[500px] px-4">
        <motion.button
          onClick={handleExit}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{
            backgroundColor: 'rgba(26, 26, 46, 0.8)',
            color: '#ffd700',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 10px rgba(255, 215, 0, 0.3)',
            border: '1px solid rgba(255, 215, 0, 0.3)'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>分数</div>
          <div className="text-3xl font-bold" style={{ color: '#ffaa00' }}>{score}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>波次</div>
          <div className="text-2xl font-bold" style={{ color: '#ff6600' }}>{wave}</div>
        </div>

        <div className="flex items-center gap-1">
          {[...Array(3)].map((_, i) => (
            <motion.span
              key={i}
              className="text-xl"
              animate={{ scale: i < lives ? 1 : 0.8, opacity: i < lives ? 1 : 0.3 }}
            >
              ✈️
            </motion.span>
          ))}
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>最高</div>
          <div className="text-xl font-bold" style={{ color: '#ffd700' }}>{bestScore}</div>
        </div>
      </div>

      {gameState === 'playing' && (
        <div className="flex items-center gap-4 px-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(255, 170, 0, 0.3)', border: '1px solid rgba(255, 170, 0, 0.5)' }}>
            <span>🔥</span>
            <span style={{ color: '#ffaa00' }}>x{player.fireLevel}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(100, 200, 255, 0.3)', border: '1px solid rgba(100, 200, 255, 0.5)' }}>
            <span>🛡</span>
            <span style={{ color: '#64c8ff' }}>{player.hasShield ? 'ON' : 'OFF'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(255, 100, 100, 0.3)', border: '1px solid rgba(255, 100, 100, 0.5)' }}>
            <span>🚀</span>
            <span style={{ color: '#ff6464' }}>x{player.missiles}</span>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden cursor-crosshair"
        style={{
          boxShadow: '0 0 30px rgba(255, 170, 0, 0.3)',
          border: '2px solid rgba(255, 170, 0, 0.4)'
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
        />

        <AnimatePresence>
          {gameState === 'idle' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(26, 10, 10, 0.95)', backdropFilter: 'blur(5px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ y: [0, -10, 0], rotate: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                ✈️
              </motion.div>
              <div className="text-4xl font-bold mb-2" style={{ color: '#ffd700' }}>
                二战空战
              </div>
              <div className="text-lg mb-8" style={{ color: '#ffaa00' }}>
                二战飞机空战模拟
              </div>
              <motion.button
                onClick={handleStart}
                className="px-8 py-4 rounded-xl text-xl font-bold mb-4"
                style={{
                  background: 'linear-gradient(135deg, #ff6600 0%, #cc4400 100%)',
                  color: '#ffffff',
                  boxShadow: '0 0 30px rgba(255, 102, 0, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开始游戏
              </motion.button>
              <div className="text-sm opacity-60" style={{ color: '#aaaaaa' }}>
                按空格键开始 | 鼠标瞄准 | 空格/Mshoot M发射导弹
              </div>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(26, 10, 10, 0.95)', backdropFilter: 'blur(5px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-5xl font-bold mb-4" style={{ color: '#ff6600' }}>
                任务失败
              </div>
              <div className="text-3xl mb-2" style={{ color: '#ffd700' }}>
                得分: {score}
              </div>
              <div className="text-xl mb-2" style={{ color: '#ffaa00' }}>
                波次: {wave}
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
              <div className="text-xl mb-6" style={{ color: '#ffd700' }}>
                最高: {bestScore}
              </div>
              <motion.button
                onClick={handleRestart}
                className="px-8 py-4 rounded-xl text-xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #ffd700 0%, #cc9900 100%)',
                  color: '#1a0a0a',
                  boxShadow: '0 0 30px rgba(255, 215, 0, 0.5)'
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

      <div className="text-center opacity-60 text-sm" style={{ color: '#ffaa00' }}>
        <div>WASD/方向键 移动 | 鼠标瞄准 | 空格/点击 射击 | M 发射导弹</div>
      </div>
    </div>
  );
}
