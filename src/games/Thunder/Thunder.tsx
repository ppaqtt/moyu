import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { THUNDER_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { ThunderEngine, Player, Enemy, Bullet, PowerUp } from './engine';

const { BULLET_WIDTH, BULLET_HEIGHT } = THUNDER_CONSTANTS;

const BG_GRADIENT = 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)';

export default function Thunder() {
  const navigate = useNavigate();
  const [engine] = useState(() => new ThunderEngine());
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [player, setPlayer] = useState<Player>(() => engine.getState().player);
  const [enemies, setEnemies] = useState<Enemy[]>(() => engine.getState().enemies);
  const [playerBullets, setPlayerBullets] = useState<Bullet[]>(() => engine.getState().playerBullets);
  const [enemyBullets, setEnemyBullets] = useState<Bullet[]>(() => engine.getState().enemyBullets);
  const [powerUps, setPowerUps] = useState<PowerUp[]>(() => engine.getState().powerUps);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [bestScore, setBestScore] = useLocalStorage(STORAGE_KEYS.THUNDER, 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const lastShotRef = useRef(0);
  const { width, height } = engine.getCanvasSize();

  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleScoreUpdate = useCallback((newScore: number) => {
  }, []);

  const handleGameOver = useCallback((finalScore: number) => {
  }, []);

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setEnemies([...state.enemies]);
    setPlayerBullets([...state.playerBullets]);
    setEnemyBullets([...state.enemyBullets]);
    setPowerUps([...state.powerUps]);
    setScore(state.score);
    setLives(state.lives);

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

        if (e.key === 'b' || e.key === 'B') {
          engine.useBomb();
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
      gradient.addColorStop(0, '#0f0f1a');
      gradient.addColorStop(0.5, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 50; i++) {
        const x = (Date.now() * 0.02 + i * 50) % (width + 100) - 50;
        const y = (i * 37) % height;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.3})`;
        ctx.fill();
      }

      powerUps.forEach(p => {
        const colors = { fire: '#ff6b6b', shield: '#4ecdc4', bomb: '#ffeaa7' };
        const icons = { fire: '🔥', shield: '🛡', bomb: '💣' };
        ctx.fillStyle = colors[p.type];
        ctx.beginPath();
        ctx.arc(p.x + 15, p.y + 15, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '16px Arial';
        ctx.fillText(icons[p.type], p.x + 5, p.y + 20);
      });

      playerBullets.forEach(b => {
        const gradient = ctx.createLinearGradient(b.x, b.y + BULLET_HEIGHT, b.x, b.y);
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(1, '#ff6600');
        ctx.fillStyle = gradient;
        ctx.fillRect(b.x, b.y, BULLET_WIDTH, BULLET_HEIGHT);
      });

      enemyBullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x + 4, b.y + 4, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0066';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(b.x + 4, b.y + 4, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ff99cc';
        ctx.fill();
      });

      enemies.forEach(e => {
        const colors = ['#ff4757', '#ff6348', '#ffa502'];
        const color = colors[e.type - 1] || colors[0];

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(e.x + e.width / 2, e.y);
        ctx.lineTo(e.x + e.width, e.y + e.height);
        ctx.lineTo(e.x, e.y + e.height);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(e.x + e.width / 2 - 5, e.y + e.height / 2, 3, 0, Math.PI * 2);
        ctx.arc(e.x + e.width / 2 + 5, e.y + e.height / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      const state = engine.getState();
      const p = state.player;
      if (gameState === 'playing') {
        const alpha = state.invincibleTime > 0 && Math.floor(state.invincibleTime / 5) % 2 === 0 ? 0.5 : 1;

        if (p.hasShield) {
          ctx.beginPath();
          ctx.arc(p.x + p.width / 2, p.y + p.height / 2, 35, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(78, 205, 196, ${alpha})`;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = `rgba(78, 205, 196, ${alpha * 0.2})`;
          ctx.fill();
        }

        ctx.globalAlpha = alpha;
        const planeGradient = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
        planeGradient.addColorStop(0, '#00d2ff');
        planeGradient.addColorStop(1, '#3a7bd5');
        ctx.fillStyle = planeGradient;
        ctx.beginPath();
        ctx.moveTo(p.x + p.width / 2, p.y);
        ctx.lineTo(p.x + p.width, p.y + p.height);
        ctx.lineTo(p.x + p.width / 2, p.y + p.height - 10);
        ctx.lineTo(p.x, p.y + p.height);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x + p.width / 2 - 5, p.y + 15, 4, 0, Math.PI * 2);
        ctx.arc(p.x + p.width / 2 + 5, p.y + 15, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#00d2ff';
        ctx.fillRect(p.x + p.width / 2 - 3, p.y + p.height - 5, 6, 10);

        ctx.globalAlpha = 1;
      }

      requestAnimationFrame(render);
    };

    render();
  }, [engine, gameState, player, enemies, playerBullets, enemyBullets, powerUps, width, height]);

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
          <div className="text-xl font-bold" style={{ color: '#00d2ff' }}>{bestScore}</div>
        </div>
      </div>

      {gameState === 'playing' && (
        <div className="flex items-center gap-4 px-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(255, 107, 107, 0.3)', border: '1px solid rgba(255, 107, 107, 0.5)' }}>
            <span>🔥</span>
            <span style={{ color: '#ff6b6b' }}>x{player.fireLevel}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(78, 205, 196, 0.3)', border: '1px solid rgba(78, 205, 196, 0.5)' }}>
            <span>🛡</span>
            <span style={{ color: '#4ecdc4' }}>{player.hasShield ? 'ON' : 'OFF'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(255, 234, 167, 0.3)', border: '1px solid rgba(255, 234, 167, 0.5)' }}>
            <span>💣</span>
            <span style={{ color: '#ffeaa7' }}>x{player.bombs}</span>
          </div>
        </div>
      )}

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          boxShadow: '0 0 30px rgba(255, 107, 157, 0.3)',
          border: '2px solid rgba(255, 107, 157, 0.4)'
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
              style={{ backgroundColor: 'rgba(15, 15, 26, 0.95)', backdropFilter: 'blur(5px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⚡
              </motion.div>
              <div className="text-4xl font-bold mb-2" style={{ color: '#ffffff' }}>
                雷电
              </div>
              <div className="text-lg mb-8" style={{ color: '#ffd700' }}>
                经典竖版飞行射击
              </div>
              <motion.button
                onClick={handleStart}
                className="px-8 py-4 rounded-xl text-xl font-bold mb-4"
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
                按空格键开始
              </div>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(15, 15, 26, 0.95)', backdropFilter: 'blur(5px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-5xl font-bold mb-4" style={{ color: '#ff6b9d' }}>
                游戏结束
              </div>
              <div className="text-3xl mb-2" style={{ color: '#ffd700' }}>
                得分: {score}
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
                className="px-8 py-4 rounded-xl text-xl font-bold"
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
        <div>← → ↑ ↓ 或 WASD 移动 | 空格 发射 | B 炸弹</div>
      </div>
    </div>
  );
}
