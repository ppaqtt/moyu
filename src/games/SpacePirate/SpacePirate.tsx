import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { SpacePirateEngine, SpacePirateState } from './engine';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 30;
const ENEMY_SIZE = 25;

type GameScreen = 'menu' | 'playing' | 'gameover';

export default function SpacePirate() {
  const navigate = useNavigate();
  const [engine] = useState(() => new SpacePirateEngine());
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [state, setState] = useState<SpacePirateState>(() => engine.getState());
  const { record, updateScore } = useGameRecord('space_pirate');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleTick = useCallback(() => {
    engine.tick();
    setState(engine.getState());
  }, [engine]);

  useGameLoop({ callback: handleTick, delay: 16, enabled: screen === 'playing' });

  useEffect(() => {
    if (screen === 'playing' && state.isGameOver) {
      setScreen('gameover');
      updateScore(state.score);
    }
  }, [state.isGameOver, screen, state.score, updateScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || screen !== 'playing') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, '#1a0a2e');
      gradient.addColorStop(0.5, '#0a1a2e');
      gradient.addColorStop(1, '#0a0a1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      for (let i = 0; i < 60; i++) {
        const x = (Date.now() * 0.02 + i * 47) % CANVAS_WIDTH;
        const y = (i * 31 + Date.now() * 0.03) % CANVAS_HEIGHT;
        const size = 0.5 + Math.random() * 1.5;
        const opacity = 0.2 + Math.random() * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }

      state.explosions.forEach(exp => {
        const progress = exp.frame / exp.maxFrames;
        const radius = progress * exp.size;
        const alpha = 1 - progress;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 50, ${alpha * 0.5})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
        ctx.fill();
      });

      state.loots.forEach(loot => {
        const colors = { gold: '#ffd700', gem: '#ff00ff', health: '#ff6b9d' };
        ctx.fillStyle = colors[loot.type];
        ctx.beginPath();
        if (loot.type === 'gold') {
          ctx.arc(loot.x, loot.y, 8, 0, Math.PI * 2);
        } else if (loot.type === 'gem') {
          ctx.moveTo(loot.x, loot.y - 10);
          ctx.lineTo(loot.x + 8, loot.y);
          ctx.lineTo(loot.x, loot.y + 10);
          ctx.lineTo(loot.x - 8, loot.y);
          ctx.closePath();
        } else {
          ctx.moveTo(loot.x, loot.y - 8);
          ctx.lineTo(loot.x + 8, loot.y + 8);
          ctx.lineTo(loot.x - 8, loot.y + 8);
          ctx.closePath();
        }
        ctx.fill();
        ctx.shadowColor = colors[loot.type];
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      state.enemies.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);

        if (enemy.type === 'escort') {
          ctx.fillStyle = '#8b0000';
          ctx.beginPath();
          ctx.moveTo(0, -ENEMY_SIZE);
          ctx.lineTo(ENEMY_SIZE * 0.8, ENEMY_SIZE * 0.6);
          ctx.lineTo(-ENEMY_SIZE * 0.8, ENEMY_SIZE * 0.6);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = '#ff4444';
          ctx.beginPath();
          ctx.moveTo(0, ENEMY_SIZE);
          ctx.lineTo(ENEMY_SIZE * 0.7, -ENEMY_SIZE * 0.5);
          ctx.lineTo(-ENEMY_SIZE * 0.7, -ENEMY_SIZE * 0.5);
          ctx.closePath();
          ctx.fill();
        }

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        const healthPercent = enemy.health / enemy.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(enemy.x - 15, enemy.y - ENEMY_SIZE - 8, 30, 4);
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff88' : healthPercent > 0.25 ? '#ffaa00' : '#ff4444';
        ctx.fillRect(enemy.x - 15, enemy.y - ENEMY_SIZE - 8, 30 * healthPercent, 4);
      });

      state.bullets.forEach(bullet => {
        const color = bullet.fromPlayer ? '#00ffff' : '#ff4444';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.fromPlayer ? 5 : 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      const p = state.player;
      const alpha = state.invincibleTime > 0 && Math.floor(state.invincibleTime / 5) % 2 === 0 ? 0.5 : 1;
      ctx.globalAlpha = alpha;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      ctx.fillStyle = '#00d2ff';
      ctx.beginPath();
      ctx.moveTo(0, -PLAYER_SIZE);
      ctx.lineTo(PLAYER_SIZE * 0.7, PLAYER_SIZE * 0.5);
      ctx.lineTo(0, PLAYER_SIZE * 0.3);
      ctx.lineTo(-PLAYER_SIZE * 0.7, PLAYER_SIZE * 0.5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      ctx.globalAlpha = 1;

      const healthPercent = p.health / p.maxHealth;
      ctx.fillStyle = '#333';
      ctx.fillRect(p.x - 25, p.y - PLAYER_SIZE - 15, 50, 6);
      ctx.fillStyle = healthPercent > 0.5 ? '#00ff88' : healthPercent > 0.25 ? '#ffaa00' : '#ff4444';
      ctx.fillRect(p.x - 25, p.y - PLAYER_SIZE - 15, 50 * healthPercent, 6);

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [state, screen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      engine.setKeyPressed(key, true);
      if ((key === ' ' || key === 'j') && screen === 'playing') {
        engine.shoot();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      engine.setKeyPressed(key, false);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [engine, screen]);

  const startGame = useCallback(() => {
    engine.reset();
    setState(engine.getState());
    engine.start();
    setScreen('playing');
  }, [engine]);

  const handleRestart = useCallback(() => {
    engine.reset();
    setState(engine.getState());
    engine.start();
    setScreen('playing');
  }, [engine]);

  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  if (screen === 'menu') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ backgroundColor: NEON_COLORS.background }}>
        <motion.div className="text-center" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <h1 className="text-5xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>星际海盗</h1>
          <p className="text-xl mb-2" style={{ color: NEON_COLORS.neonPurple }}>Space Pirate</p>
          <div className="text-6xl mb-8">🏴‍☠️</div>
          
          <div className="mb-8 text-left p-6 rounded-xl" style={{ backgroundColor: NEON_COLORS.surface }}>
            <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.gold }}>游戏说明</h3>
            <ul className="space-y-2 text-sm" style={{ color: NEON_COLORS.text }}>
              <li>WASD或方向键移动飞船</li>
              <li>空格键或J键发射子弹</li>
              <li>击杀海盗获得战利品</li>
              <li>收集金币、宝石恢复生命</li>
            </ul>
          </div>

          {record.bestScore > 0 && <div className="mb-4 text-lg" style={{ color: NEON_COLORS.gold }}>最高记录: {record.bestScore}</div>}

          <motion.button
            onClick={startGame}
            className="px-12 py-4 rounded-xl text-2xl font-bold"
            style={{ backgroundColor: NEON_COLORS.neonPink, color: NEON_COLORS.text, boxShadow: `0 0 30px ${NEON_COLORS.neonPink}60` }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            开始游戏
          </motion.button>

          <motion.button onClick={handleExit} className="mt-4 px-6 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: NEON_COLORS.surface, color: NEON_COLORS.neonPink }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            返回首页
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (screen === 'gameover') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ backgroundColor: NEON_COLORS.background }}>
        <motion.div className="text-center p-8 rounded-2xl" style={{ backgroundColor: NEON_COLORS.surface }} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <h2 className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.danger }}>游戏结束</h2>
          <div className="text-6xl mb-4">💀</div>
          <div className="space-y-3 mb-8">
            <div className="text-xl" style={{ color: NEON_COLORS.gold }}>最终得分: <span className="text-3xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{state.score}</span></div>
            <div className="text-lg" style={{ color: NEON_COLORS.neonPurple }}>到达波数: {state.wave}</div>
            <div className="flex justify-center gap-4 text-lg" style={{ color: NEON_COLORS.gold }}>
              <span>💰 {state.gold}</span>
              <span>💎 {state.gems}</span>
            </div>
            {state.score > record.bestScore && <div className="text-xl animate-pulse" style={{ color: NEON_COLORS.neonGreen }}>新纪录!</div>}
          </div>
          <div className="flex gap-4 justify-center">
            <motion.button onClick={handleRestart} className="px-8 py-3 rounded-xl font-bold text-lg" style={{ backgroundColor: NEON_COLORS.neonPink, color: NEON_COLORS.text, boxShadow: `0 0 20px ${NEON_COLORS.neonPink}` }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              再来一局
            </motion.button>
            <motion.button onClick={handleExit} className="px-8 py-3 rounded-xl font-bold text-lg" style={{ backgroundColor: NEON_COLORS.surface, color: NEON_COLORS.neonPink, border: `2px solid ${NEON_COLORS.neonPink}` }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              返回首页
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex items-center justify-between w-full max-w-[800px] px-2">
        <motion.button onClick={handleExit} className="px-3 py-2 rounded-lg font-bold text-sm" style={{ backgroundColor: NEON_COLORS.surface, color: NEON_COLORS.neonPink }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>返回</motion.button>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>波数</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonPurple }}>{state.wave}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>得分</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{state.score}</div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-lg">💰</span>
            <span className="text-lg font-bold" style={{ color: NEON_COLORS.gold }}>{state.gold}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-lg">💎</span>
            <span className="text-lg font-bold" style={{ color: NEON_COLORS.neonPurple }}>{state.gems}</span>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(state.lives)].map((_, i) => (
              <span key={i} className="text-lg">🚀</span>
            ))}
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
            <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonPink }}>{record.bestScore}</div>
          </div>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden" style={{ boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`, border: `2px solid ${NEON_COLORS.neonPink}40` }}>
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ cursor: 'crosshair', background: NEON_COLORS.background }} />
      </div>

      <div className="text-center text-sm opacity-60" style={{ color: NEON_COLORS.gold }}>
        WASD移动 | 空格键射击
      </div>
    </div>
  );
}
