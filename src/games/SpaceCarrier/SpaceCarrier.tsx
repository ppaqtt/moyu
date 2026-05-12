import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { SpaceCarrierEngine, SpaceCarrierState } from './engine';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

type FighterType = 'assault' | 'bomber' | 'interceptor';

const FIGHTER_ICONS: Record<FighterType, string> = {
  assault: '🚀',
  bomber: '💣',
  interceptor: '⚡',
};

const FIGHTER_COLORS: Record<FighterType, string> = {
  assault: '#00ffff',
  bomber: '#ff6600',
  interceptor: '#ff00ff',
};

const FIGHTER_PRICES: Record<FighterType, number> = {
  assault: 100,
  bomber: 200,
  interceptor: 150,
};

type GameScreen = 'menu' | 'playing' | 'gameover';

export default function SpaceCarrier() {
  const navigate = useNavigate();
  const [engine] = useState(() => new SpaceCarrierEngine());
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [state, setState] = useState<SpaceCarrierState>(() => engine.getState());
  const [selectedType, setSelectedType] = useState<FighterType>('assault');
  const { record, updateScore } = useGameRecord('space_carrier');
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
      gradient.addColorStop(0, '#0a0a1a');
      gradient.addColorStop(0.5, '#1a1a2e');
      gradient.addColorStop(1, '#0f0f1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      for (let i = 0; i < 50; i++) {
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

      state.enemies.forEach(enemy => {
        const colors = { scout: '#ffff00', fighter: '#ff4444', bomber: '#ff8800' };
        ctx.fillStyle = colors[enemy.type];
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y + 12);
        ctx.lineTo(enemy.x + 12, enemy.y - 8);
        ctx.lineTo(enemy.x - 12, enemy.y - 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      state.bullets.forEach(bullet => {
        const color = bullet.fromPlayer ? '#00ffff' : '#ff4444';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.type === 'missile' ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      state.fighters.forEach(fighter => {
        ctx.save();
        ctx.translate(fighter.x, fighter.y);
        ctx.rotate(fighter.angle);
        ctx.fillStyle = FIGHTER_COLORS[fighter.type];
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, -8);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      ctx.fillStyle = '#667eea';
      ctx.beginPath();
      ctx.ellipse(state.carrierX, state.carrierY, 60, 40, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a7bd5';
      ctx.beginPath();
      ctx.ellipse(state.carrierX, state.carrierY, 45, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(state.carrierX, state.carrierY - 10, 10, 0, Math.PI * 2);
      ctx.fill();

      const healthPercent = state.carrierHealth / state.carrierMaxHealth;
      ctx.fillStyle = '#333';
      ctx.fillRect(state.carrierX - 50, state.carrierY + 50, 100, 8);
      ctx.fillStyle = healthPercent > 0.5 ? '#00ff88' : healthPercent > 0.25 ? '#ffaa00' : '#ff4444';
      ctx.fillRect(state.carrierX - 50, state.carrierY + 50, 100 * healthPercent, 8);

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [state, screen]);

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

    const handleClick = () => {
      if (screen === 'playing') {
        engine.launchFighter();
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
          <h1 className="text-5xl font-bold mb-4" style={{ color: NEON_COLORS.neonPurple }}>太空母舰</h1>
          <p className="text-xl mb-2" style={{ color: NEON_COLORS.neonCyan }}>Space Carrier</p>
          <div className="text-6xl mb-8">🚀</div>
          
          <div className="mb-8 text-left p-6 rounded-xl" style={{ backgroundColor: NEON_COLORS.surface }}>
            <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.gold }}>游戏说明</h3>
            <ul className="space-y-2 text-sm" style={{ color: NEON_COLORS.text }}>
              <li>移动鼠标控制母舰位置</li>
              <li>点击空白区域发射战机</li>
              <li>战机自动攻击附近的敌人</li>
              <li>保护母舰不被敌人摧毁</li>
            </ul>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {(Object.keys(FIGHTER_ICONS) as FighterType[]).map(type => (
                <div key={type} className="flex flex-col items-center p-2 rounded-lg" style={{ backgroundColor: `${FIGHTER_COLORS[type]}30` }}>
                  <span className="text-2xl">{FIGHTER_ICONS[type]}</span>
                  <span className="text-xs" style={{ color: FIGHTER_COLORS[type] }}>{FIGHTER_PRICES[type]}金</span>
                </div>
              ))}
            </div>
          </div>

          {record.bestScore > 0 && <div className="mb-4 text-lg" style={{ color: NEON_COLORS.gold }}>最高记录: {record.bestScore}</div>}

          <motion.button
            onClick={startGame}
            className="px-12 py-4 rounded-xl text-2xl font-bold"
            style={{ backgroundColor: NEON_COLORS.neonPurple, color: NEON_COLORS.text, boxShadow: `0 0 30px ${NEON_COLORS.neonPurple}60` }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            开始游戏
          </motion.button>

          <motion.button onClick={handleExit} className="mt-4 px-6 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: NEON_COLORS.surface, color: NEON_COLORS.neonPurple }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
            <div className="text-xl" style={{ color: NEON_COLORS.gold }}>最终得分: <span className="text-3xl font-bold" style={{ color: NEON_COLORS.neonPurple }}>{state.score}</span></div>
            <div className="text-lg" style={{ color: NEON_COLORS.neonCyan }}>到达波数: {state.wave}</div>
            {state.score > record.bestScore && <div className="text-xl animate-pulse" style={{ color: NEON_COLORS.neonGreen }}>新纪录!</div>}
          </div>
          <div className="flex gap-4 justify-center">
            <motion.button onClick={handleRestart} className="px-8 py-3 rounded-xl font-bold text-lg" style={{ backgroundColor: NEON_COLORS.neonPurple, color: NEON_COLORS.text, boxShadow: `0 0 20px ${NEON_COLORS.neonPurple}` }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              再来一局
            </motion.button>
            <motion.button onClick={handleExit} className="px-8 py-3 rounded-xl font-bold text-lg" style={{ backgroundColor: NEON_COLORS.surface, color: NEON_COLORS.neonPurple, border: `2px solid ${NEON_COLORS.neonPurple}` }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
        <motion.button onClick={handleExit} className="px-3 py-2 rounded-lg font-bold text-sm" style={{ backgroundColor: NEON_COLORS.surface, color: NEON_COLORS.neonPurple }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>返回</motion.button>
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
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.gold }}>{state.credits}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>战机</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>{state.fighterCount}/{state.fighterCapacity}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
            <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonPurple }}>{record.bestScore}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {(Object.keys(FIGHTER_ICONS) as FighterType[]).map(type => (
          <motion.button
            key={type}
            onClick={() => setSelectedType(type)}
            className="flex flex-col items-center p-2 rounded-lg transition-all"
            style={{
              backgroundColor: selectedType === type ? `${FIGHTER_COLORS[type]}60` : NEON_COLORS.surface,
              border: `2px solid ${selectedType === type ? FIGHTER_COLORS[type] : 'transparent'}`,
              opacity: state.credits < FIGHTER_PRICES[type] ? 0.5 : 1
            }}
            whileHover={{ scale: state.credits >= FIGHTER_PRICES[type] ? 1.05 : 1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-2xl">{FIGHTER_ICONS[type]}</span>
            <span className="text-xs" style={{ color: FIGHTER_COLORS[type] }}>{FIGHTER_PRICES[type]}金</span>
          </motion.button>
        ))}
      </div>

      <div className="relative rounded-xl overflow-hidden" style={{ boxShadow: `0 0 30px ${NEON_COLORS.neonPurple}30`, border: `2px solid ${NEON_COLORS.neonPurple}40` }}>
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ cursor: 'crosshair', background: NEON_COLORS.background }} />
      </div>

      <div className="text-center text-sm opacity-60" style={{ color: NEON_COLORS.gold }}>
        移动鼠标控制母舰 | 点击发射战机
      </div>
    </div>
  );
}
