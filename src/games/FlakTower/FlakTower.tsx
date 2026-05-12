import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { FLAK_TOWER_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { FlakTowerEngine, Bullet, Enemy, Explosion } from './engine';

const { TOWER_X, TOWER_Y, TOWER_RADIUS } = FLAK_TOWER_CONSTANTS;

const BG_GRADIENT = 'linear-gradient(180deg, #1a1a2e 0%, #2d2d4a 50%, #1a2a1a 100%)';

export default function FlakTower() {
  const navigate = useNavigate();
  const [engine] = useState(() => new FlakTowerEngine());
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [tower, setTower] = useState(() => engine.getState().tower);
  const [enemies, setEnemies] = useState<Enemy[]>(() => engine.getState().enemies);
  const [bullets, setBullets] = useState<Bullet[]>(() => engine.getState().bullets);
  const [explosions, setExplosions] = useState<Explosion[]>(() => engine.getState().explosions);
  const [score, setScore] = useState(0);
  const [ammo, setAmmo] = useState(100);
  const [wave, setWave] = useState(1);
  const [bestScore, setBestScore] = useLocalStorage(STORAGE_KEYS.FLAK_TOWER, 0);
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
    setTower({ ...state.tower });
    setEnemies([...state.enemies]);
    setBullets([...state.bullets]);
    setExplosions([...state.explosions]);
    setScore(state.score);
    setAmmo(state.ammo);
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
        if (now - lastShotRef.current > 80) {
          engine.shoot();
          lastShotRef.current = now;
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
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(0.5, '#2d2d4a');
      gradient.addColorStop(1, '#1a2a1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#2d3d2d';
      ctx.fillRect(0, TOWER_Y + TOWER_RADIUS, CANVAS_WIDTH, CANVAS_HEIGHT - TOWER_Y - TOWER_RADIUS);

      ctx.strokeStyle = '#3d4d3d';
      ctx.lineWidth = 2;
      for (let x = 0; x < CANVAS_WIDTH; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, TOWER_Y + TOWER_RADIUS);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }

      for (let i = 0; i < 40; i++) {
        const x = (i * 47) % CANVAS_WIDTH;
        const y = (i * 31) % (TOWER_Y + TOWER_RADIUS - 20) + 20;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 200, ${0.3 + Math.random() * 0.3})`;
        ctx.fill();
      }

      explosions.forEach(e => {
        const progress = e.frame / e.maxFrames;
        const alpha = 1 - progress;

        const explosionGradient = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius * (1 + progress));
        explosionGradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
        explosionGradient.addColorStop(0.3, `rgba(255, 200, 100, ${alpha})`);
        explosionGradient.addColorStop(0.7, `rgba(255, 100, 50, ${alpha * 0.7})`);
        explosionGradient.addColorStop(1, `rgba(100, 50, 0, 0)`);

        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * (1 + progress), 0, Math.PI * 2);
        ctx.fillStyle = explosionGradient;
        ctx.fill();
      });

      enemies.forEach(e => {
        ctx.save();
        ctx.translate(e.x + e.width / 2, e.y + e.height / 2);
        ctx.rotate(e.angle);

        if (e.type === 'bomber') {
          ctx.fillStyle = '#556B2F';
          ctx.beginPath();
          ctx.ellipse(0, 0, e.width / 2, e.height / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#3d4d3d';
          ctx.fillRect(-e.width / 4, -e.height / 4, e.width / 2, e.height / 2);
        } else if (e.type === 'fighter') {
          ctx.fillStyle = '#8B4513';
          ctx.beginPath();
          ctx.moveTo(e.width / 2, 0);
          ctx.lineTo(-e.width / 2, -e.height / 2);
          ctx.lineTo(-e.width / 4, 0);
          ctx.lineTo(-e.width / 2, e.height / 2);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = '#ff4444';
          ctx.beginPath();
          ctx.moveTo(e.width / 2, 0);
          ctx.lineTo(-e.width / 2, -e.height / 2);
          ctx.lineTo(-e.width / 2, e.height / 2);
          ctx.closePath();
          ctx.fill();
        }

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

      bullets.forEach(b => {
        if (b.type === 'tracer') {
          ctx.beginPath();
          ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#ffff00';
          ctx.fill();
          ctx.strokeStyle = '#ffaa00';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x - b.vx * 2, b.y - b.vy * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#888';
          ctx.beginPath();
          ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      if (gameState === 'playing') {
        ctx.beginPath();
        ctx.arc(TOWER_X, TOWER_Y, TOWER_RADIUS + 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.fill();
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(TOWER_X, TOWER_Y, TOWER_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#4a4a4a';
        ctx.fill();
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.arc(TOWER_X, TOWER_Y, TOWER_RADIUS * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(TOWER_X, TOWER_Y);
        ctx.rotate(tower.angle);

        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(-5, -5, 60, 10);
        ctx.fillStyle = '#6a6a6a';
        ctx.fillRect(45, -8, 15, 16);

        ctx.restore();
      }

      requestAnimationFrame(render);
    };

    render();
  }, [engine, gameState, tower, enemies, bullets, explosions, width, height]);

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
          <div className="text-3xl font-bold" style={{ color: '#ff8800' }}>{score}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>波次</div>
          <div className="text-2xl font-bold" style={{ color: '#ff4444' }}>{wave}</div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>弹药</div>
          <div className="w-20 h-4 rounded-full overflow-hidden" style={{ backgroundColor: '#333' }}>
            <motion.div
              className="h-full"
              style={{
                backgroundColor: ammo > 30 ? '#ffaa00' : ammo > 10 ? '#ff8800' : '#ff4444',
                width: `${Math.min(100, ammo)}%`
              }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>最高</div>
          <div className="text-xl font-bold" style={{ color: '#ffd700' }}>{bestScore}</div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden cursor-crosshair"
        style={{
          boxShadow: '0 0 30px rgba(255, 136, 0, 0.3)',
          border: '2px solid rgba(255, 136, 0, 0.4)'
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
              style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)', backdropFilter: 'blur(5px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                🎯
              </motion.div>
              <div className="text-4xl font-bold mb-2" style={{ color: '#ff8800' }}>
                防空炮塔
              </div>
              <div className="text-lg mb-8" style={{ color: '#ffaa00' }}>
                保护你的阵地不被敌机摧毁
              </div>
              <motion.button
                onClick={handleStart}
                className="px-8 py-4 rounded-xl text-xl font-bold mb-4"
                style={{
                  background: 'linear-gradient(135deg, #ff8800 0%, #cc5500 100%)',
                  color: '#ffffff',
                  boxShadow: '0 0 30px rgba(255, 136, 0, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开始防御
              </motion.button>
              <div className="text-sm opacity-60" style={{ color: '#aaaaaa' }}>
                空格开始 | 鼠标瞄准 | 点击/空格 射击 | R 装填
              </div>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)', backdropFilter: 'blur(5px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-5xl font-bold mb-4" style={{ color: '#ff4444' }}>
                阵地失守
              </div>
              <div className="text-3xl mb-2" style={{ color: '#ffd700' }}>
                得分: {score}
              </div>
              <div className="text-xl mb-2" style={{ color: '#ff8800' }}>
                波次: {wave}
              </div>
              {score >= bestScore && score > 0 && (
                <motion.div
                  className="text-xl mb-4"
                  style={{ color: '#00ff00' }}
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
                  background: 'linear-gradient(135deg, #ff8800 0%, #cc5500 100%)',
                  color: '#ffffff',
                  boxShadow: '0 0 30px rgba(255, 136, 0, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                重新部署
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-center opacity-60 text-sm" style={{ color: '#ff8800' }}>
        <div>鼠标瞄准 | 空格/点击 射击 | R 装填</div>
      </div>
    </div>
  );
}
