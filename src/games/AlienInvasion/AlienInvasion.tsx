import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ALIEN_INVASION_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { AlienInvasionEngine, Bullet, Alien, PowerUp, Explosion } from './engine';

const { PLAYER_WIDTH, PLAYER_HEIGHT, BULLET_WIDTH, BULLET_HEIGHT } = ALIEN_INVASION_CONSTANTS;

const BG_GRADIENT = 'linear-gradient(180deg, #0a0010 0%, #1a0a2e 50%, #0f0520 100%)';

export default function AlienInvasion() {
  const navigate = useNavigate();
  const [engine] = useState(() => new AlienInvasionEngine());
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [player, setPlayer] = useState(() => engine.getState().player);
  const [aliens, setAliens] = useState<Alien[]>(() => engine.getState().aliens);
  const [playerBullets, setPlayerBullets] = useState<Bullet[]>(() => engine.getState().playerBullets);
  const [alienBullets, setAlienBullets] = useState<Bullet[]>(() => engine.getState().alienBullets);
  const [powerUps, setPowerUps] = useState<PowerUp[]>(() => engine.getState().powerUps);
  const [explosions, setExplosions] = useState<Explosion[]>(() => engine.getState().explosions);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [bestScore, setBestScore] = useLocalStorage(STORAGE_KEYS.ALIEN_INVASION, 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
    setAliens([...state.aliens]);
    setPlayerBullets([...state.playerBullets]);
    setAlienBullets([...state.alienBullets]);
    setPowerUps([...state.powerUps]);
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
        if (now - lastShotRef.current > 100) {
          engine.shoot();
          lastShotRef.current = now;
        }

        if (e.key === 'n' || e.key === 'N') {
          engine.useNuke();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
      engine.setKey(e.key, false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
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
      gradient.addColorStop(0, '#0a0010');
      gradient.addColorStop(0.5, '#1a0a2e');
      gradient.addColorStop(1, '#0f0520');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 80; i++) {
        const x = (Date.now() * 0.01 + i * 40) % (width + 20) - 10;
        const y = (i * 37) % height;
        const size = 1 + Math.sin(Date.now() / 500 + i) * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        const colors = ['#ffffff', '#aaaaff', '#ffaaaa', '#aaffaa'];
        ctx.fillStyle = colors[i % colors.length];
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 300 + i) * 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      explosions.forEach(e => {
        const progress = e.frame / e.maxFrames;
        const alpha = 1 - progress;

        const explosionGradient = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius * (1 + progress * 0.5));
        explosionGradient.addColorStop(0, `rgba(0, 255, 255, ${alpha})`);
        explosionGradient.addColorStop(0.4, `rgba(100, 0, 255, ${alpha * 0.8})`);
        explosionGradient.addColorStop(1, `rgba(50, 0, 100, 0)`);

        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * (1 + progress * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = explosionGradient;
        ctx.fill();
      });

      powerUps.forEach(p => {
        const colors = { laser: '#00ffff', shield: '#00ff00', nuke: '#ff4444' };
        const icons = { laser: '⚡', shield: '🛡', nuke: '💥' };

        ctx.beginPath();
        ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = colors[p.type];
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = colors[p.type];
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '16px Arial';
        ctx.fillText(icons[p.type], p.x - 8, p.y + 6);
      });

      playerBullets.forEach(b => {
        if (player.laser) {
          ctx.fillStyle = '#00ffff';
          ctx.fillRect(b.x - 3, b.y, 6, 20);
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#00ffff';
          ctx.fillRect(b.x - 1, b.y, 2, 20);
          ctx.shadowBlur = 0;
        } else {
          const bulletGradient = ctx.createLinearGradient(b.x, b.y + BULLET_HEIGHT, b.x, b.y);
          bulletGradient.addColorStop(0, '#ffff00');
          bulletGradient.addColorStop(1, '#00ffff');
          ctx.fillStyle = bulletGradient;
          ctx.fillRect(b.x - BULLET_WIDTH / 2, b.y, BULLET_WIDTH, BULLET_HEIGHT);
        }
      });

      alienBullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff00ff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffaaff';
        ctx.fill();
      });

      aliens.forEach(a => {
        const color = a.type === 'motherShip' ? '#ff00ff' : a.type === 'fighter' ? '#aa00ff' : '#00ff88';

        if (a.type === 'motherShip') {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.ellipse(a.x + a.width / 2, a.y + a.height / 2, a.width / 2, a.height / 3, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ff66ff';
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(a.x + 15 + i * 25, a.y + a.height / 2, 8, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = '#ffff00';
          ctx.beginPath();
          ctx.arc(a.x + a.width / 2, a.y + a.height / 2, 10, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(a.x + a.width / 2, a.y);
          ctx.lineTo(a.x + a.width, a.y + a.height);
          ctx.lineTo(a.x + a.width / 2, a.y + a.height * 0.7);
          ctx.lineTo(a.x, a.y + a.height);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#00ffff';
          ctx.beginPath();
          ctx.arc(a.x + a.width / 2, a.y + a.height / 2, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        if (a.health < a.maxHealth) {
          const barWidth = a.width;
          const barHeight = 4;
          ctx.fillStyle = '#333';
          ctx.fillRect(a.x, a.y - 8, barWidth, barHeight);
          ctx.fillStyle = '#ff00ff';
          ctx.fillRect(a.x, a.y - 8, barWidth * (a.health / a.maxHealth), barHeight);
        }
      });

      if (gameState === 'playing') {
        if (player.shield) {
          ctx.beginPath();
          ctx.arc(player.x, player.y, 35, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
          ctx.fill();
        }

        const planeGradient = ctx.createLinearGradient(player.x, player.y - PLAYER_HEIGHT / 2, player.x, player.y + PLAYER_HEIGHT / 2);
        planeGradient.addColorStop(0, '#00ffff');
        planeGradient.addColorStop(1, '#0088ff');
        ctx.fillStyle = planeGradient;

        ctx.beginPath();
        ctx.moveTo(player.x, player.y - PLAYER_HEIGHT / 2);
        ctx.lineTo(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2);
        ctx.lineTo(player.x + PLAYER_WIDTH / 4, player.y + PLAYER_HEIGHT / 4);
        ctx.lineTo(player.x - PLAYER_WIDTH / 4, player.y + PLAYER_HEIGHT / 4);
        ctx.lineTo(player.x - PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#00ffff';
        ctx.fillRect(player.x - 2, player.y + PLAYER_HEIGHT / 4, 4, 15);
      }

      requestAnimationFrame(render);
    };

    render();
  }, [engine, gameState, player, aliens, playerBullets, alienBullets, powerUps, explosions, width, height]);

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
            backgroundColor: 'rgba(26, 10, 46, 0.8)',
            color: '#ff00ff',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 10px rgba(255, 0, 255, 0.3)',
            border: '1px solid rgba(255, 0, 255, 0.3)'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#00ffff' }}>分数</div>
          <div className="text-3xl font-bold" style={{ color: '#ff00ff' }}>{score}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#00ffff' }}>波次</div>
          <div className="text-2xl font-bold" style={{ color: '#00ff88' }}>{wave}</div>
        </div>

        <div className="flex items-center gap-1">
          {[...Array(3)].map((_, i) => (
            <motion.span
              key={i}
              className="text-xl"
              animate={{ scale: i < lives ? 1 : 0.8, opacity: i < lives ? 1 : 0.3 }}
            >
              👽
            </motion.span>
          ))}
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#00ffff' }}>最高</div>
          <div className="text-xl font-bold" style={{ color: '#00ffff' }}>{bestScore}</div>
        </div>
      </div>

      {gameState === 'playing' && (
        <div className="flex items-center gap-4 px-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(0, 255, 255, 0.3)', border: '1px solid rgba(0, 255, 255, 0.5)' }}>
            <span>⚡</span>
            <span style={{ color: '#00ffff' }}>{player.laser ? 'ACTIVE' : 'OFF'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(0, 255, 0, 0.3)', border: '1px solid rgba(0, 255, 0, 0.5)' }}>
            <span>🛡</span>
            <span style={{ color: '#00ff88' }}>{player.shield ? 'ON' : 'OFF'}</span>
          </div>
        </div>
      )}

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          boxShadow: '0 0 30px rgba(255, 0, 255, 0.3)',
          border: '2px solid rgba(255, 0, 255, 0.4)'
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
              style={{ backgroundColor: 'rgba(10, 0, 16, 0.95)', backdropFilter: 'blur(5px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                👽
              </motion.div>
              <div className="text-4xl font-bold mb-2" style={{ color: '#ff00ff' }}>
                宇宙入侵
              </div>
              <div className="text-lg mb-8" style={{ color: '#00ffff' }}>
                外星人入侵地球!
              </div>
              <motion.button
                onClick={handleStart}
                className="px-8 py-4 rounded-xl text-xl font-bold mb-4"
                style={{
                  background: 'linear-gradient(135deg, #ff00ff 0%, #aa00aa 100%)',
                  color: '#ffffff',
                  boxShadow: '0 0 30px rgba(255, 0, 255, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                保卫地球
              </motion.button>
              <div className="text-sm opacity-60" style={{ color: '#aaaaaa' }}>
                空格开始 | 方向键/WASD移动 | 空格射击 | N核弹
              </div>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(10, 0, 16, 0.95)', backdropFilter: 'blur(5px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-5xl font-bold mb-4" style={{ color: '#ff0044' }}>
                地球沦陷
              </div>
              <div className="text-3xl mb-2" style={{ color: '#ffd700' }}>
                得分: {score}
              </div>
              <div className="text-xl mb-2" style={{ color: '#ff00ff' }}>
                波次: {wave}
              </div>
              {score >= bestScore && score > 0 && (
                <motion.div
                  className="text-xl mb-4"
                  style={{ color: '#00ffff' }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ type: 'spring' }}
                >
                  🎉 新纪录! 🎉
                </motion.div>
              )}
              <div className="text-xl mb-6" style={{ color: '#00ffff' }}>
                最高: {bestScore}
              </div>
              <motion.button
                onClick={handleRestart}
                className="px-8 py-4 rounded-xl text-xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #00ffff 0%, #0088ff 100%)',
                  color: '#0a0010',
                  boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                再次抵抗
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-center opacity-60 text-sm" style={{ color: '#ff00ff' }}>
        <div>WASD/方向键 移动 | 空格 射击 | N 核弹</div>
      </div>
    </div>
  );
}
