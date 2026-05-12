import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { MissileCommandEngine, MissileCommandState } from './engine';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 700;

type GameScreen = 'menu' | 'playing' | 'gameover';

export default function MissileCommand() {
  const navigate = useNavigate();
  const [engine] = useState(() => new MissileCommandEngine());
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [state, setState] = useState<MissileCommandState>(() => engine.getState());
  const { record, updateScore } = useGameRecord('missile_command');
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

      for (let i = 0; i < 30; i++) {
        const x = (Date.now() * 0.02 + i * 47) % CANVAS_WIDTH;
        const y = (i * 31 + Date.now() * 0.03) % (CANVAS_HEIGHT * 0.5);
        const size = 0.5 + Math.random() * 1.5;
        const opacity = 0.2 + Math.random() * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }

      const launchers = engine.getMissileLaunchers();
      launchers.forEach(launcher => {
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(launcher.x, launcher.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#006666';
        ctx.fillRect(launcher.x - 15, launcher.y, 30, 20);
      });

      state.buildings.forEach(building => {
        const colors = building.type === 'city' ? '#4a90d9' : '#3a7bd5';
        ctx.fillStyle = colors;
        ctx.fillRect(building.x, building.y, building.width, building.height);
        
        ctx.fillStyle = '#2a5a9a';
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 2; j++) {
            ctx.fillRect(building.x + 5 + i * 18, building.y + 5 + j * 18, 12, 12);
          }
        }

        if (building.health < building.maxHealth) {
          const healthPercent = building.health / building.maxHealth;
          ctx.fillStyle = '#333';
          ctx.fillRect(building.x, building.y - 8, building.width, 4);
          ctx.fillStyle = healthPercent > 0.5 ? '#00ff88' : healthPercent > 0.25 ? '#ffaa00' : '#ff4444';
          ctx.fillRect(building.x, building.y - 8, building.width * healthPercent, 4);
        }
      });

      state.explosions.forEach(exp => {
        const progress = exp.frame / exp.maxFrames;
        const radius = progress * exp.size;
        const alpha = 1 - progress;
        
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 50, ${alpha * 0.3})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 100, 50, ${alpha * 0.5})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
        ctx.fill();
      });

      state.missiles.forEach(missile => {
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(missile.startX, missile.startY);
        ctx.lineTo(missile.x, missile.y);
        ctx.stroke();

        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(missile.x, missile.y, 4, 0, Math.PI * 2);
        ctx.fill();

        if (missile.trail.length > 1) {
          ctx.strokeStyle = 'rgba(255, 68, 68, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(missile.trail[0].x, missile.trail[0].y);
          for (let i = 1; i < missile.trail.length; i++) {
            ctx.lineTo(missile.trail[i].x, missile.trail[i].y);
          }
          ctx.stroke();
        }
      });

      state.bullets.forEach(bullet => {
        const gradient = ctx.createLinearGradient(bullet.x, bullet.y, bullet.x + bullet.vx * 3, bullet.y + bullet.vy * 3);
        gradient.addColorStop(0, '#00ffff');
        gradient.addColorStop(1, '#0088ff');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bullet.x, bullet.y);
        ctx.lineTo(bullet.x + bullet.vx * 3, bullet.y + bullet.vy * 3);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [state, screen, engine]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      engine.setMousePosition(x, y);
    };

    const handleClick = (e: MouseEvent) => {
      if (screen === 'playing') {
        const rect = canvas.getBoundingClientRect();
        const scaleX = CANVAS_WIDTH / rect.width;
        const scaleY = CANVAS_HEIGHT / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        engine.shoot(x, y);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
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
          <h1 className="text-5xl font-bold mb-4" style={{ color: NEON_COLORS.danger }}>导弹拦截</h1>
          <p className="text-xl mb-2" style={{ color: NEON_COLORS.neonCyan }}>Missile Command</p>
          <div className="text-6xl mb-8">🎯</div>
          
          <div className="mb-8 text-left p-6 rounded-xl" style={{ backgroundColor: NEON_COLORS.surface }}>
            <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.gold }}>游戏说明</h3>
            <ul className="space-y-2 text-sm" style={{ color: NEON_COLORS.text }}>
              <li>点击屏幕发射拦截导弹</li>
              <li>拦截敌方来袭的导弹</li>
              <li>保护你的城市和军事基地</li>
              <li>每波结束后补充弹药</li>
            </ul>
          </div>

          {record.bestScore > 0 && <div className="mb-4 text-lg" style={{ color: NEON_COLORS.gold }}>最高记录: {record.bestScore}</div>}

          <motion.button
            onClick={startGame}
            className="px-12 py-4 rounded-xl text-2xl font-bold"
            style={{ backgroundColor: NEON_COLORS.danger, color: NEON_COLORS.text, boxShadow: `0 0 30px ${NEON_COLORS.danger}60` }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            开始游戏
          </motion.button>

          <motion.button onClick={handleExit} className="mt-4 px-6 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: NEON_COLORS.surface, color: NEON_COLORS.danger }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
          <div className="text-6xl mb-4">💥</div>
          <div className="space-y-3 mb-8">
            <div className="text-xl" style={{ color: NEON_COLORS.gold }}>最终得分: <span className="text-3xl font-bold" style={{ color: NEON_COLORS.danger }}>{state.score}</span></div>
            <div className="text-lg" style={{ color: NEON_COLORS.neonCyan }}>到达波数: {state.wave}</div>
            <div className="text-lg" style={{ color: NEON_COLORS.neonPink }}>剩余城市: {state.lives}</div>
            {state.score > record.bestScore && <div className="text-xl animate-pulse" style={{ color: NEON_COLORS.neonGreen }}>新纪录!</div>}
          </div>
          <div className="flex gap-4 justify-center">
            <motion.button onClick={handleRestart} className="px-8 py-3 rounded-xl font-bold text-lg" style={{ backgroundColor: NEON_COLORS.danger, color: NEON_COLORS.text, boxShadow: `0 0 20px ${NEON_COLORS.danger}` }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              再来一局
            </motion.button>
            <motion.button onClick={handleExit} className="px-8 py-3 rounded-xl font-bold text-lg" style={{ backgroundColor: NEON_COLORS.surface, color: NEON_COLORS.danger, border: `2px solid ${NEON_COLORS.danger}` }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              返回首页
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex items-center justify-between w-full max-w-[600px] px-2">
        <motion.button onClick={handleExit} className="px-3 py-2 rounded-lg font-bold text-sm" style={{ backgroundColor: NEON_COLORS.surface, color: NEON_COLORS.danger }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>返回</motion.button>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>波数</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{state.wave}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>得分</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{state.score}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>金币</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.gold }}>{state.money}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>弹药</div>
            <div className="text-xl font-bold" style={{ color: state.ammo > 10 ? NEON_COLORS.neonGreen : NEON_COLORS.danger }}>{state.ammo}/{state.maxAmmo}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>城市</div>
            <div className="text-xl font-bold" style={{ color: '#e74c3c' }}>{state.lives}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
            <div className="text-lg font-bold" style={{ color: NEON_COLORS.danger }}>{record.bestScore}</div>
          </div>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden" style={{ boxShadow: `0 0 30px ${NEON_COLORS.danger}30`, border: `2px solid ${NEON_COLORS.danger}40` }}>
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ cursor: 'crosshair', background: NEON_COLORS.background }} />
      </div>

      <div className="text-center text-sm opacity-60" style={{ color: NEON_COLORS.gold }}>
        点击屏幕发射拦截导弹
      </div>
    </div>
  );
}
