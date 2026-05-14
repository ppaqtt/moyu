import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { SquadronEngine, SquadronMember, Enemy, Bullet, Explosion, PowerUp } from './engine';
import { useNavigate } from 'react-router-dom';

const BG_GRADIENT = 'linear-gradient(180deg, #0a1628 0%, #1a0a28 50%, #0a1628 100%)';

const FORMATION_NAMES = ['箭头', '三角', '雁行', '菱形', '纵队'];

export default function Squadron() {
  const navigate = useNavigate();
  const [engine] = useState(() => new SquadronEngine());
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [squadron, setSquadron] = useState<SquadronMember[]>(() => engine.getState().squadron);
  const [enemies, setEnemies] = useState<Enemy[]>(() => engine.getState().enemies);
  const [playerBullets, setPlayerBullets] = useState<Bullet[]>(() => engine.getState().playerBullets);
  const [enemyBullets, setEnemyBullets] = useState<Bullet[]>(() => engine.getState().enemyBullets);
  const [explosions, setExplosions] = useState<Explosion[]>(() => engine.getState().explosions);
  const [powerUps, setPowerUps] = useState<PowerUp[]>(() => engine.getState().powerUps);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [formation, setFormation] = useState(0);
  const [ammo, setAmmo] = useState(100);
  const [bestScore, setBestScore] = useLocalStorage('squadron_highscore', 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const { width, height } = engine.getCanvasSize();

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setSquadron([...state.squadron]);
    setEnemies([...state.enemies]);
    setPlayerBullets([...state.playerBullets]);
    setEnemyBullets([...state.enemyBullets]);
    setExplosions([...state.explosions]);
    setPowerUps([...state.powerUps]);
    setScore(state.score);
    setLevel(state.level);
    setFormation(state.formation);
    setAmmo(state.ammo);

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
      gradient.addColorStop(0, '#0a1628');
      gradient.addColorStop(0.5, '#1a0a28');
      gradient.addColorStop(1, '#0a1628');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 60; i++) {
        const x = (i * 37 + Date.now() * 0.02) % width;
        const y = (i * 29 + Date.now() * 0.03) % height;
        const size = 0.5 + Math.random() * 1.5;
        const opacity = 0.3 + Math.random() * 0.7;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }

      const nebulaGradient = ctx.createRadialGradient(width * 0.2, height * 0.3, 0, width * 0.2, height * 0.3, 200);
      nebulaGradient.addColorStop(0, 'rgba(100, 0, 100, 0.1)');
      nebulaGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = nebulaGradient;
      ctx.fillRect(0, 0, width, height);

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
        const colors: Record<string, string> = { repair: '#00ff88', ammo: '#ffff00', shield: '#00d2ff', bomb: '#ff6b9d' };
        const icons: Record<string, string> = { repair: '🔧', ammo: '📦', shield: '🛡', bomb: '💣' };

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
        bulletGradient.addColorStop(0, '#00ffff');
        bulletGradient.addColorStop(1, '#0088ff');
        ctx.fillStyle = bulletGradient;
        ctx.fillRect(b.x, b.y, b.width, b.height);
      });

      enemyBullets.forEach(b => {
        const bulletGradient = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.height);
        bulletGradient.addColorStop(0, '#ff4400');
        bulletGradient.addColorStop(1, '#ff0000');
        ctx.fillStyle = bulletGradient;
        ctx.fillRect(b.x, b.y, b.width, b.height);
      });

      enemies.forEach(e => {
        const bodyGradient = ctx.createLinearGradient(e.x, e.y, e.x, e.y + e.height);
        
        if (e.type === 'bomber') {
          bodyGradient.addColorStop(0, '#8b0000');
          bodyGradient.addColorStop(1, '#4a0000');
          ctx.fillStyle = bodyGradient;
          ctx.fillRect(e.x + e.width * 0.2, e.y + e.height * 0.3, e.width * 0.6, e.height * 0.4);
          ctx.fillRect(e.x, e.y + e.height * 0.4, e.width, e.height * 0.2);
        } else if (e.type === 'fighter') {
          bodyGradient.addColorStop(0, '#ff4500');
          bodyGradient.addColorStop(1, '#cc3700');
          ctx.fillStyle = bodyGradient;
          ctx.beginPath();
          ctx.moveTo(e.x + e.width / 2, e.y + e.height);
          ctx.lineTo(e.x + e.width, e.y);
          ctx.lineTo(e.x, e.y);
          ctx.closePath();
          ctx.fill();
        } else {
          bodyGradient.addColorStop(0, '#ff1493');
          bodyGradient.addColorStop(1, '#c71585');
          ctx.fillStyle = bodyGradient;
          ctx.beginPath();
          ctx.arc(e.x + e.width / 2, e.y + e.height / 2, e.width / 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        if (e.health < e.maxHealth) {
          const healthBarWidth = e.width;
          const healthBarHeight = 3;
          const healthPercent = e.health / e.maxHealth;
          ctx.fillStyle = '#333';
          ctx.fillRect(e.x, e.y - 6, healthBarWidth, healthBarHeight);
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(e.x, e.y - 6, healthBarWidth * healthPercent, healthBarHeight);
        }
      });

      squadron.forEach((member, index) => {
        if (!member.alive) return;

        const alpha = member.invincibleTime > 0 && Math.floor(member.invincibleTime / 5) % 2 === 0 ? 0.5 : 1;
        ctx.globalAlpha = alpha;

        const planeGradient = ctx.createLinearGradient(member.x, member.y - 20, member.x, member.y + 20);
        if (index === 0) {
          planeGradient.addColorStop(0, '#ffd700');
          planeGradient.addColorStop(0.5, '#ff8800');
          planeGradient.addColorStop(1, '#ff4400');
        } else {
          planeGradient.addColorStop(0, '#00ffff');
          planeGradient.addColorStop(0.5, '#0088ff');
          planeGradient.addColorStop(1, '#0044aa');
        }
        ctx.fillStyle = planeGradient;

        ctx.beginPath();
        ctx.moveTo(member.x, member.y - 18);
        ctx.lineTo(member.x + 15, member.y + 10);
        ctx.lineTo(member.x + 8, member.y + 15);
        ctx.lineTo(member.x - 8, member.y + 15);
        ctx.lineTo(member.x - 15, member.y + 10);
        ctx.closePath();
        ctx.fill();

        if (index === 0) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(member.x, member.y - 5, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(member.x, member.y + 15);
        ctx.lineTo(member.x - 5, member.y + 22 + Math.random() * 5);
        ctx.lineTo(member.x, member.y + 18);
        ctx.lineTo(member.x + 5, member.y + 22 + Math.random() * 5);
        ctx.closePath();
        ctx.fill();

        if (member.invincibleTime > 0) {
          ctx.beginPath();
          ctx.arc(member.x, member.y, 25, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 200, 255, ${member.invincibleTime / 300})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        const healthBarWidth = 30;
        const healthBarHeight = 3;
        const healthPercent = member.health / member.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(member.x - healthBarWidth / 2, member.y - 25, healthBarWidth, healthBarHeight);
        ctx.fillStyle = index === 0 ? '#ffd700' : '#00ffff';
        ctx.fillRect(member.x - healthBarWidth / 2, member.y - 25, healthBarWidth * healthPercent, healthBarHeight);

        ctx.globalAlpha = 1;
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [engine, gameState, squadron, enemies, playerBullets, enemyBullets, explosions, powerUps, width, height]);

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

  const aliveCount = squadron.filter(m => m.alive).length;
  const ammoPercent = (ammo / 100) * 100;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[600px] px-4">
        <motion.button
          onClick={() => navigate('/')}
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
          <div className="text-3xl font-bold" style={{ color: '#ffd700' }}>{score}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>等级</div>
          <div className="text-2xl font-bold" style={{ color: '#00ff88' }}>{level}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>队形</div>
          <div className="text-lg font-bold" style={{ color: '#ff6b9d' }}>{FORMATION_NAMES[formation]}</div>
        </div>

        <div className="flex items-center gap-1">
          {squadron.map((member, i) => (
            <motion.span
              key={i}
              animate={{
                scale: member.alive ? 1 : 0.7,
                opacity: member.alive ? 1 : 0.3
              }}
              style={{ color: i === 0 ? '#ffd700' : '#00ffff' }}
            >
              ✈️
            </motion.span>
          ))}
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>最高</div>
          <div className="text-xl font-bold" style={{ color: '#a855f7' }}>{bestScore}</div>
        </div>
      </div>

      <div className="flex items-center gap-4 px-4" style={{ width: '600px' }}>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm" style={{ color: '#ffd700' }}>弹药</span>
          <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="h-full transition-all" style={{ width: `${ammoPercent}%`, backgroundColor: ammoPercent > 50 ? '#00ffff' : ammoPercent > 20 ? '#ff8800' : '#ff0000' }} />
          </div>
        </div>
        <div className="text-sm font-bold" style={{ color: '#00ffff' }}>
          {ammo}
        </div>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          boxShadow: '0 0 40px rgba(255, 215, 0, 0.3)',
          border: '2px solid rgba(255, 215, 0, 0.4)'
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
              style={{ backgroundColor: 'rgba(10, 22, 40, 0.95)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-7xl mb-6"
                animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✈️
              </motion.div>
              <div className="text-4xl font-bold mb-3" style={{ color: '#ffd700' }}>
                战机编队
              </div>
              <div className="text-lg mb-2" style={{ color: '#ffd700' }}>
                指挥你的飞行编队
              </div>
              <div className="text-sm mb-8" style={{ color: '#888888' }}>
                消灭敌人保护领空
              </div>
              <motion.button
                onClick={handleStart}
                className="px-10 py-4 rounded-xl text-xl font-bold mb-4"
                style={{
                  background: 'linear-gradient(135deg, #ffd700 0%, #ff8800 100%)',
                  color: '#1a1a2e',
                  boxShadow: '0 0 30px rgba(255, 215, 0, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开始任务
              </motion.button>
              <div className="text-sm opacity-60" style={{ color: '#aaaaaa' }}>
                方向键/WASD移动 | Tab切换队形 | 空格发射 | Shift使用炸弹
              </div>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(10, 22, 40, 0.95)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                💥
              </motion.div>
              <div className="text-5xl font-bold mb-4" style={{ color: '#ff4444' }}>
                编队全灭
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
                  style={{ color: '#ff6b9d' }}
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
                重新编队
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-6 mt-2 text-xs" style={{ color: '#aaaaaa' }}>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ffd700' }}>✈️</span>
          <span>队长(金色)</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#00ffff' }}>✈️</span>
          <span>队员</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ff6b9d' }}>Tab</span>
          <span>切换队形</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ff4444' }}>Shift</span>
          <span>炸弹</span>
        </div>
      </div>
    </div>
  );
}
