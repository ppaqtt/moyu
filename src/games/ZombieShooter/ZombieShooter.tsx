import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ZOMBIE_SHOOTER_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { ZombieShooterEngine, Player, Zombie, Bullet, PowerUp } from './engine';
import { useNavigate } from 'react-router-dom';

const BG_GRADIENT = 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)';

export default function ZombieShooter() {
  const navigate = useNavigate();
  const [engine] = useState(() => new ZombieShooterEngine());
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [player, setPlayer] = useState<Player>(() => engine.getState().player);
  const [zombies, setZombies] = useState<Zombie[]>(() => engine.getState().zombies);
  const [bullets, setBullets] = useState<Bullet[]>(() => engine.getState().bullets);
  const [powerUps, setPowerUps] = useState<PowerUp[]>(() => engine.getState().powerUps);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [bestScore, setBestScore] = useLocalStorage(STORAGE_KEYS.ZOMBIE_SHOOTER, 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastShotRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const { width, height } = engine.getCanvasSize();

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setZombies([...state.zombies]);
    setBullets([...state.bullets]);
    setPowerUps([...state.powerUps]);
    setScore(state.score);
    setWave(state.wave);

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
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(0.5, '#16213e');
      gradient.addColorStop(1, '#0f0f1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(0, 255, 136, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      for (let i = 0; i < 30; i++) {
        const x = (Date.now() * 0.02 + i * 73) % (width + 100) - 50;
        const y = (i * 41 + Date.now() * 0.03) % height;
        const size = 0.3 + Math.random() * 1;
        const opacity = 0.1 + Math.random() * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }

      powerUps.forEach(p => {
        const colors = {
          health: '#ff6b9d',
          ammo: '#ffd700',
          score: '#00ff88'
        };
        const icons = {
          health: '+',
          ammo: '•',
          score: '$'
        };

        ctx.save();
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
        ctx.rotate(Date.now() / 800);

        const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;

        ctx.beginPath();
        ctx.arc(0, 0, (p.width / 2) * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `${colors[p.type]}33`;
        ctx.fill();
        ctx.strokeStyle = colors[p.type];
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = colors[p.type];
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icons[p.type], p.x + p.width / 2, p.y + p.height / 2);

        const remaining = p.lifetime / 300;
        ctx.beginPath();
        ctx.arc(p.x + p.width / 2, p.y + p.height + 5, 4, 0, Math.PI * 2);
        ctx.fillStyle = remaining > 0.3 ? '#00ff88' : '#ff4444';
        ctx.fill();
      });

      bullets.forEach(b => {
        const angle = Math.atan2(b.vy, b.vx);
        ctx.save();
        ctx.translate(b.x + b.width / 2, b.y + b.height / 2);
        ctx.rotate(angle);

        const bulletGradient = ctx.createLinearGradient(-b.width, 0, b.width, 0);
        bulletGradient.addColorStop(0, '#ffff00');
        bulletGradient.addColorStop(0.5, '#ffaa00');
        bulletGradient.addColorStop(1, '#ff6600');
        ctx.fillStyle = bulletGradient;
        ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.width / 2, 0, b.width / 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      zombies.forEach(z => {
        const zombieColors = {
          normal: '#4a7c59',
          fast: '#7c4a4a',
          tank: '#4a4a7c'
        };
        const color = zombieColors[z.type];

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(z.x + z.width / 2, z.y + z.height / 2, z.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2d4a35';
        ctx.fillRect(z.x + z.width * 0.2, z.y + z.height * 0.25, z.width * 0.2, z.height * 0.15);
        ctx.fillRect(z.x + z.width * 0.6, z.y + z.height * 0.25, z.width * 0.2, z.height * 0.15);

        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(z.x + z.width * 0.3, z.y + z.height * 0.3, 3, 0, Math.PI * 2);
        ctx.arc(z.x + z.width * 0.7, z.y + z.height * 0.3, 3, 0, Math.PI * 2);
        ctx.fill();

        if (z.type === 'tank') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.beginPath();
          ctx.arc(z.x + z.width / 2, z.y + z.height / 2, z.width / 2 - 5, 0, Math.PI * 2);
          ctx.fill();
        }

        const healthPercent = z.health / z.maxHealth;
        const healthBarWidth = z.width;
        const healthBarHeight = 4;
        const healthBarX = z.x;
        const healthBarY = z.y - 8;

        ctx.fillStyle = '#333';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff88' : healthPercent > 0.25 ? '#ffaa00' : '#ff4444';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
      });

      const state = engine.getState();
      const p = state.player;

      if (gameState === 'playing' || gameState === 'idle') {
        const alpha = p.invincibleTime > 0 && Math.floor(p.invincibleTime / 5) % 2 === 0 ? 0.5 : 1;
        ctx.globalAlpha = alpha;

        ctx.fillStyle = '#3a7bd5';
        ctx.beginPath();
        ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#667eea';
        ctx.beginPath();
        ctx.arc(p.x + p.width / 2, p.y + p.height / 2 - 5, p.width / 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x + p.width / 2, p.y + p.height * 0.35, 4, 0, Math.PI * 2);
        ctx.fill();

        const gunLength = 15;
        const gunWidth = 6;
        ctx.save();
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
        ctx.rotate(p.angle);
        ctx.fillStyle = '#555';
        ctx.fillRect(0, -gunWidth / 2, gunLength, gunWidth);
        ctx.restore();

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
  }, [engine, gameState, player, zombies, bullets, powerUps, width, height]);

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

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.add(key);
      engine.setKeyPressed(key, true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.delete(key);
      engine.setKeyPressed(key, false);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine, gameState, width, height]);

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
      <div className="flex items-center justify-between w-full max-w-[800px] px-4">
        <motion.button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{
            backgroundColor: 'rgba(26, 26, 46, 0.8)',
            color: '#00ff88',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 10px rgba(0, 255, 136, 0.3)',
            border: '1px solid rgba(0, 255, 136, 0.3)'
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
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>波次</div>
          <div className="text-2xl font-bold" style={{ color: '#00ff88' }}>{wave}</div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="px-3 py-1 rounded-full text-sm font-bold"
            style={{
              backgroundColor: 'rgba(255, 107, 157, 0.3)',
              border: '1px solid rgba(255, 107, 157, 0.5)',
              color: '#ff6b9d'
            }}
          >
            HP {player.health}/{player.maxHealth}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="px-3 py-1 rounded-full text-sm font-bold"
            style={{
              backgroundColor: 'rgba(255, 215, 0, 0.3)',
              border: '1px solid rgba(255, 215, 0, 0.5)',
              color: '#ffd700'
            }}
          >
            AMMO {player.ammo}/{player.maxAmmo}
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>最高</div>
          <div className="text-xl font-bold" style={{ color: '#00d2ff' }}>{bestScore}</div>
        </div>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          boxShadow: '0 0 40px rgba(0, 255, 136, 0.3)',
          border: '2px solid rgba(0, 255, 136, 0.4)'
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ cursor: 'crosshair', background: BG_GRADIENT }}
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
                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🧟
              </motion.div>
              <div className="text-4xl font-bold mb-3" style={{ color: '#ffffff' }}>
                僵尸射击
              </div>
              <div className="text-lg mb-8" style={{ color: '#ffd700' }}>
                在僵尸围城中生存下去
              </div>
              <motion.button
                onClick={handleStart}
                className="px-10 py-4 rounded-xl text-xl font-bold mb-4"
                style={{
                  background: 'linear-gradient(135deg, #00ff88 0%, #00aa55 100%)',
                  color: '#ffffff',
                  boxShadow: '0 0 30px rgba(0, 255, 136, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开始游戏
              </motion.button>
              <div className="text-sm opacity-60" style={{ color: '#aaaaaa' }}>
                WASD移动 | 鼠标瞄准 | 点击射击
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
                💀
              </motion.div>
              <div className="text-5xl font-bold mb-4" style={{ color: '#ff4444' }}>
                游戏结束
              </div>
              <div className="text-3xl mb-2" style={{ color: '#ffd700' }}>
                得分: {score}
              </div>
              <div className="text-lg mb-2" style={{ color: '#00ff88' }}>
                到达波次: {wave}
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
        <div>WASD移动 | 鼠标瞄准 | 点击发射</div>
      </div>

      <div className="flex gap-6 mt-2 text-xs" style={{ color: '#aaaaaa' }}>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ff6b9d' }}>+</span>
          <span>生命恢复</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ffd700' }}>•</span>
          <span>弹药补给</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#00ff88' }}>$</span>
          <span>分数加成</span>
        </div>
      </div>
    </div>
  );
}
