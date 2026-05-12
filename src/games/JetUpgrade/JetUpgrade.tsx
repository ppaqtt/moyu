import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { JetUpgradeEngine, JetUpgradeState, UpgradeType, UPGRADE_COSTS, UPGRADE_NAMES } from './engine';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;
const PLAYER_SIZE = 40;

const UPGRADE_ICONS: Record<UpgradeType, string> = {
  damage: '💥',
  fireRate: '⚡',
  speed: '🏃',
  multiShot: '🔫',
  piercing: '🎯',
  missile: '🚀',
  shield: '🛡',
};

type GameScreen = 'menu' | 'playing' | 'gameover' | 'upgrade';

export default function JetUpgrade() {
  const navigate = useNavigate();
  const [engine] = useState(() => new JetUpgradeEngine());
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [state, setState] = useState<JetUpgradeState>(() => engine.getState());
  const [upgrades, setUpgrades] = useState<Record<UpgradeType, number>>(() => engine.getUpgrades());
  const { record, updateScore } = useGameRecord('jet_upgrade');
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
      gradient.addColorStop(0.3, '#1a1a2e');
      gradient.addColorStop(1, '#0f0f1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      for (let i = 0; i < 40; i++) {
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

      state.powerUps.forEach(p => {
        const colors = { health: '#ff6b9d', damage: '#ff4444', speed: '#00ff88', shield: '#00d2ff' };
        const icons = { health: '+', damage: '!', speed: '>', shield: 'O' };
        ctx.save();
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
        ctx.rotate(Date.now() / 500);
        ctx.beginPath();
        ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
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
      });

      state.bullets.forEach(b => {
        const color = b.type === 'missile' ? '#ff6600' : '#00ffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.type === 'missile' ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      state.enemies.forEach(e => {
        const colors = { basic: '#ff6348', fast: '#ffa502', tank: '#9b59b6', boss: '#ff0000' };
        ctx.fillStyle = colors[e.type];
        if (e.type === 'boss') {
          ctx.beginPath();
          ctx.moveTo(e.x, e.y - 30);
          ctx.lineTo(e.x + 30, e.y + 20);
          ctx.lineTo(e.x - 30, e.y + 20);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(e.x - 10, e.y, 5, 0, Math.PI * 2);
          ctx.arc(e.x + 10, e.y, 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(e.x, e.y + 15);
          ctx.lineTo(e.x + 15, e.y - 10);
          ctx.lineTo(e.x - 15, e.y - 10);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(e.x - 5, e.y - 2, 2, 0, Math.PI * 2);
          ctx.arc(e.x + 5, e.y - 2, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        const healthPercent = e.health / e.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(e.x - 15, e.y - 25, 30, 4);
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff88' : healthPercent > 0.25 ? '#ffaa00' : '#ff4444';
        ctx.fillRect(e.x - 15, e.y - 25, 30 * healthPercent, 4);
      });

      const p = state.player;
      ctx.fillStyle = '#00d2ff';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - PLAYER_SIZE / 2);
      ctx.lineTo(p.x + PLAYER_SIZE / 2, p.y + PLAYER_SIZE / 2);
      ctx.lineTo(p.x - PLAYER_SIZE / 2, p.y + PLAYER_SIZE / 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();

      if (p.shieldEnabled) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, PLAYER_SIZE, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

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
        engine.shoot();
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
    setUpgrades(engine.getUpgrades());
    engine.start();
    setScreen('playing');
  }, [engine]);

  const handleRestart = useCallback(() => {
    engine.reset();
    setState(engine.getState());
    setUpgrades(engine.getUpgrades());
    engine.start();
    setScreen('playing');
  }, [engine]);

  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handlePurchaseUpgrade = useCallback((type: UpgradeType) => {
    if (engine.purchaseUpgrade(type)) {
      setUpgrades(engine.getUpgrades());
      setState(engine.getState());
    }
  }, [engine]);

  const openUpgradeMenu = useCallback(() => {
    setScreen('upgrade');
  }, []);

  const closeUpgradeMenu = useCallback(() => {
    setScreen('playing');
  }, []);

  if (screen === 'menu') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ backgroundColor: NEON_COLORS.background }}>
        <motion.div className="text-center" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <h1 className="text-5xl font-bold mb-4" style={{ color: NEON_COLORS.neonCyan }}>战机升级</h1>
          <p className="text-xl mb-2" style={{ color: NEON_COLORS.neonPink }}>Jet Upgrade</p>
          <div className="text-6xl mb-8">✈️</div>
          
          <div className="mb-8 text-left p-6 rounded-xl" style={{ backgroundColor: NEON_COLORS.surface }}>
            <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.gold }}>游戏说明</h3>
            <ul className="space-y-2 text-sm" style={{ color: NEON_COLORS.text }}>
              <li>移动鼠标控制战机移动</li>
              <li>点击发射子弹攻击敌人</li>
              <li>击杀敌人获得金币和经验</li>
              <li>升级后可在商店购买强化</li>
            </ul>
          </div>

          {record.bestScore > 0 && <div className="mb-4 text-lg" style={{ color: NEON_COLORS.gold }}>最高记录: {record.bestScore}</div>}

          <motion.button
            onClick={startGame}
            className="px-12 py-4 rounded-xl text-2xl font-bold"
            style={{ backgroundColor: NEON_COLORS.neonCyan, color: NEON_COLORS.background, boxShadow: `0 0 30px ${NEON_COLORS.neonCyan}60` }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            开始游戏
          </motion.button>

          <motion.button onClick={handleExit} className="mt-4 px-6 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: NEON_COLORS.surface, color: NEON_COLORS.neonCyan }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
            <div className="text-xl" style={{ color: NEON_COLORS.gold }}>最终得分: <span className="text-3xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>{state.score}</span></div>
            <div className="text-lg" style={{ color: NEON_COLORS.neonPink }}>到达波数: {state.wave}</div>
            <div className="text-lg" style={{ color: NEON_COLORS.neonGreen }}>战机等级: {state.player.level}</div>
            {state.score > record.bestScore && <div className="text-xl animate-pulse" style={{ color: NEON_COLORS.neonGreen }}>新纪录!</div>}
          </div>
          <div className="flex gap-4 justify-center">
            <motion.button onClick={handleRestart} className="px-8 py-3 rounded-xl font-bold text-lg" style={{ backgroundColor: NEON_COLORS.neonCyan, color: NEON_COLORS.background, boxShadow: `0 0 20px ${NEON_COLORS.neonCyan}` }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              再来一局
            </motion.button>
            <motion.button onClick={handleExit} className="px-8 py-3 rounded-xl font-bold text-lg" style={{ backgroundColor: NEON_COLORS.surface, color: NEON_COLORS.neonCyan, border: `2px solid ${NEON_COLORS.neonCyan}` }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              返回首页
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (screen === 'upgrade') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ backgroundColor: NEON_COLORS.background }}>
        <motion.div className="text-center p-8 rounded-2xl max-w-lg" style={{ backgroundColor: NEON_COLORS.surface }} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <h2 className="text-3xl font-bold mb-6" style={{ color: NEON_COLORS.neonCyan }}>战机升级商店</h2>
          <div className="text-xl mb-6" style={{ color: NEON_COLORS.gold }}>金币: {state.money}</div>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(UPGRADE_ICONS) as UpgradeType[]).map(type => {
              const cost = engine.getUpgradeCost(type);
              const level = upgrades[type];
              const maxed = cost === Infinity;
              return (
                <motion.button
                  key={type}
                  onClick={() => handlePurchaseUpgrade(type)}
                  className="p-3 rounded-lg text-left"
                  style={{
                    backgroundColor: maxed ? '#333' : NEON_COLORS.surface,
                    border: `2px solid ${maxed ? '#555' : level > 0 ? '#00ff88' : '#00d2ff'}`,
                    opacity: maxed || cost > state.money ? 0.5 : 1
                  }}
                  whileHover={!maxed && cost <= state.money ? { scale: 1.02 } : {}}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{UPGRADE_ICONS[type]}</span>
                    <div>
                      <div className="font-bold" style={{ color: NEON_COLORS.text }}>{UPGRADE_NAMES[type]}</div>
                      <div className="text-sm" style={{ color: maxed ? '#888' : NEON_COLORS.gold }}>
                        {maxed ? '已满级' : `${cost} 金币`}
                      </div>
                      <div className="text-xs" style={{ color: NEON_COLORS.neonGreen }}>等级 {level}</div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
          <motion.button
            onClick={closeUpgradeMenu}
            className="mt-6 px-8 py-3 rounded-xl font-bold"
            style={{ backgroundColor: NEON_COLORS.neonPink, color: NEON_COLORS.text }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            返回战斗
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex items-center justify-between w-full max-w-[600px] px-2">
        <motion.button onClick={handleExit} className="px-3 py-2 rounded-lg font-bold text-sm" style={{ backgroundColor: NEON_COLORS.surface, color: NEON_COLORS.neonCyan }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>返回</motion.button>
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
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>等级</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonGreen }}>{state.player.level}</div>
          </div>
          <motion.button onClick={openUpgradeMenu} className="px-3 py-1 rounded-lg font-bold text-sm" style={{ backgroundColor: NEON_COLORS.neonPink, color: NEON_COLORS.text }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>商店</motion.button>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden" style={{ boxShadow: `0 0 30px ${NEON_COLORS.neonCyan}30`, border: `2px solid ${NEON_COLORS.neonCyan}40` }}>
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ cursor: 'crosshair', background: NEON_COLORS.background }} />
      </div>

      <div className="text-center text-sm opacity-60" style={{ color: NEON_COLORS.gold }}>
        移动鼠标控制战机 | 点击发射
      </div>
    </div>
  );
}
