import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { WW2FighterEngine, Player, Enemy, Bullet, PowerUp, Explosion } from './engine';
import { useNavigate } from 'react-router-dom';

const BG_GRADIENT = 'linear-gradient(135deg, #1a1a2e 0%, #2d132c 50%, #1a1a2e 100%)';

export default function WW2Fighter() {
  const navigate = useNavigate();
  const [engine] = useState(() => new WW2FighterEngine());
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [player, setPlayer] = useState<Player>(() => engine.getState().player);
  const [enemies, setEnemies] = useState<Enemy[]>(() => engine.getState().enemies);
  const [playerBullets, setPlayerBullets] = useState<Bullet[]>(() => engine.getState().playerBullets);
  const [enemyBullets, setEnemyBullets] = useState<Bullet[]>(() => engine.getState().enemyBullets);
  const [powerUps, setPowerUps] = useState<PowerUp[]>(() => engine.getState().powerUps);
  const [explosions, setExplosions] = useState<Explosion[]>(() => engine.getState().explosions);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [wave, setWave] = useState(1);
  const [bestScore, setBestScore] = useLocalStorage('ww2fighter_highscore', 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const { width, height } = engine.getCanvasSize();

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setEnemies([...state.enemies]);
    setPlayerBullets([...state.playerBullets]);
    setEnemyBullets([...state.enemyBullets]);
    setPowerUps([...state.powerUps]);
    setExplosions([...state.explosions]);
    setScore(state.score);
    setLevel(state.level);
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
      gradient.addColorStop(0.3, '#2d132c');
      gradient.addColorStop(0.7, '#1a1a2e');
      gradient.addColorStop(1, '#2d132c');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 40; i++) {
        const x = (i * 47 + Date.now() * 0.02) % width;
        const y = (i * 31 + Date.now() * 0.03) % height;
        const size = 0.5 + Math.random();
        const opacity = 0.3 + Math.random() * 0.4;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }

      explosions.forEach(exp => {
        const progress = exp.frame / exp.maxFrames;
        const radius = progress * exp.size;
        const alpha = 1 - progress;

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 150, 50, ${alpha * 0.5})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 80, 20, ${alpha * 0.7})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
        ctx.fill();
      });

      powerUps.forEach(p => {
        const colors: Record<string, string> = { health: '#00ff88', shield: '#00d2ff', bomb: '#ff6b9d' };
        const icons: Record<string, string> = { health: '❤', shield: '🛡', bomb: '💣' };

        ctx.save();
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
        ctx.rotate(Date.now() / 300);

        ctx.beginPath();
        ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = `${colors[p.type]}33`;
        ctx.fill();
        ctx.strokeStyle = colors[p.type];
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
        ctx.font = '16px Arial';
        ctx.fillText(icons[p.type], p.x + 5, p.y + p.height / 2 + 5);
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

      enemyBullets.forEach(b => {
        const bulletGradient = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.height);
        bulletGradient.addColorStop(0, '#ff4400');
        bulletGradient.addColorStop(0.5, '#ff0000');
        bulletGradient.addColorStop(1, '#880000');
        ctx.fillStyle = bulletGradient;
        ctx.fillRect(b.x, b.y, b.width, b.height);
      });

      enemies.forEach(e => {
        const bodyGradient = ctx.createLinearGradient(e.x, e.y, e.x, e.y + e.height);
        if (e.type === 'ace') {
          bodyGradient.addColorStop(0, '#ff4757');
          bodyGradient.addColorStop(1, '#c0392b');
        } else if (e.type === 'bomber') {
          bodyGradient.addColorStop(0, '#9b59b6');
          bodyGradient.addColorStop(1, '#6c3483');
        } else {
          bodyGradient.addColorStop(0, '#e74c3c');
          bodyGradient.addColorStop(1, '#922b21');
        }
        ctx.fillStyle = bodyGradient;

        if (e.type === 'bomber') {
          ctx.fillRect(e.x, e.y + e.height * 0.2, e.width, e.height * 0.6);
          ctx.fillRect(e.x + e.width * 0.3, e.y, e.width * 0.4, e.height);
        } else {
          ctx.beginPath();
          ctx.moveTo(e.x + e.width / 2, e.y + e.height);
          ctx.lineTo(e.x + e.width, e.y);
          ctx.lineTo(e.x, e.y);
          ctx.closePath();
          ctx.fill();
        }

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(e.x + e.width * 0.35, e.y + e.height * 0.35, 3, 0, Math.PI * 2);
        ctx.arc(e.x + e.width * 0.65, e.y + e.height * 0.35, 3, 0, Math.PI * 2);
        ctx.fill();

        if (e.health < e.maxHealth) {
          const healthBarWidth = e.width;
          const healthBarHeight = 4;
          const healthPercent = e.health / e.maxHealth;
          ctx.fillStyle = '#333';
          ctx.fillRect(e.x, e.y - 8, healthBarWidth, healthBarHeight);
          ctx.fillStyle = '#00ff88';
          ctx.fillRect(e.x, e.y - 8, healthBarWidth * healthPercent, healthBarHeight);
        }
      });

      const state = engine.getState();
      const p = state.player;

      if (gameState === 'playing') {
        const alpha = state.invincibleTime > 0 && Math.floor(state.invincibleTime / 5) % 2 === 0 ? 0.4 : 1;
        ctx.globalAlpha = alpha;

        const shipGradient = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
        shipGradient.addColorStop(0, '#4a7c59');
        shipGradient.addColorStop(0.5, '#3d5c45');
        shipGradient.addColorStop(1, '#2d3e30');
        ctx.fillStyle = shipGradient;

        ctx.beginPath();
        ctx.moveTo(p.x + p.width / 2, p.y);
        ctx.lineTo(p.x + p.width, p.y + p.height * 0.7);
        ctx.lineTo(p.x + p.width * 0.85, p.y + p.height);
        ctx.lineTo(p.x + p.width * 0.15, p.y + p.height);
        ctx.lineTo(p.x, p.y + p.height * 0.7);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(p.x + p.width * 0.35, p.y + p.height * 0.15, p.width * 0.3, p.height * 0.25);

        ctx.fillStyle = '#2d3e30';
        ctx.fillRect(p.x + p.width * 0.1, p.y + p.height * 0.5, p.width * 0.8, p.height * 0.15);

        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(p.x + p.width / 2, p.y + p.height * 0.45, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.moveTo(p.x + p.width / 2, p.y + p.height);
        ctx.lineTo(p.x + p.width / 2 - 6, p.y + p.height + 12);
        ctx.lineTo(p.x + p.width / 2, p.y + p.height + 8);
        ctx.lineTo(p.x + p.width / 2 + 6, p.y + p.height + 12);
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
  }, [engine, gameState, player, enemies, playerBullets, enemyBullets, powerUps, explosions, width, height]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      engine.setKeyDown(e.key);

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

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
      engine.setKeyUp(e.key);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
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
            color: '#00ffff',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)',
            border: '1px solid rgba(0, 255, 255, 0.3)'
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

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>波次</div>
          <div className="text-2xl font-bold" style={{ color: '#00d2ff' }}>{wave}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>最高</div>
          <div className="text-xl font-bold" style={{ color: '#a855f7' }}>{bestScore}</div>
        </div>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          boxShadow: '0 0 40px rgba(0, 255, 255, 0.3)',
          border: '2px solid rgba(0, 255, 255, 0.4)'
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
              style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-7xl mb-6"
                animate={{ y: [0, -15, 0], rotate: [0, 3, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                ✈️
              </motion.div>
              <div className="text-4xl font-bold mb-3" style={{ color: '#ffffff' }}>
                二战空战
              </div>
              <div className="text-lg mb-2" style={{ color: '#ffd700' }}>
                驾驶P-51野马战斗机
              </div>
              <div className="text-sm mb-8" style={{ color: '#888888' }}>
                消灭入侵的敌机编队
              </div>
              <motion.button
                onClick={handleStart}
                className="px-10 py-4 rounded-xl text-xl font-bold mb-4"
                style={{
                  background: 'linear-gradient(135deg, #00ffff 0%, #00d2ff 100%)',
                  color: '#1a1a2e',
                  boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开始战斗
              </motion.button>
              <div className="text-sm opacity-60" style={{ color: '#aaaaaa' }}>
                方向键/WASD移动 | 空格键发射 | 点击开始
              </div>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)', backdropFilter: 'blur(8px)' }}
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
                任务失败
              </div>
              <div className="text-3xl mb-2" style={{ color: '#ffd700' }}>
                得分: {score}
              </div>
              <div className="text-lg mb-2" style={{ color: '#00ff88' }}>
                等级: {level} | 波次: {wave}
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
              <div className="text-xl mb-6" style={{ color: '#a855f7' }}>
                最高: {bestScore}
              </div>
              <motion.button
                onClick={handleRestart}
                className="px-10 py-4 rounded-xl text-xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                  color: '#ffffff',
                  boxShadow: '0 0 30px rgba(168, 85, 247, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                再次挑战
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-6 mt-2 text-xs" style={{ color: '#aaaaaa' }}>
        <div className="flex items-center gap-1">
          <span style={{ color: '#00ff88' }}>❤</span>
          <span>生命恢复</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#00d2ff' }}>🛡</span>
          <span>护盾</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ff6b9d' }}>💣</span>
          <span>炸弹</span>
        </div>
      </div>
    </div>
  );
}
