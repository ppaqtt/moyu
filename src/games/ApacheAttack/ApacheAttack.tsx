import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { APACHE_ATTACK_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { ApacheAttackEngine, Bullet, Target, Explosion } from './engine';

const { HELI_WIDTH, HELI_HEIGHT, TARGET_WIDTH, TARGET_HEIGHT } = APACHE_ATTACK_CONSTANTS;

const BG_GRADIENT = 'linear-gradient(180deg, #1a3a1a 0%, #2d4a2d 50%, #1a1a0a 100%)';

export default function ApacheAttack() {
  const navigate = useNavigate();
  const [engine] = useState(() => new ApacheAttackEngine());
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [heli, setHeli] = useState(() => engine.getState().heli);
  const [targets, setTargets] = useState<Target[]>(() => engine.getState().targets);
  const [bullets, setBullets] = useState<Bullet[]>(() => engine.getState().bullets);
  const [explosions, setExplosions] = useState<Explosion[]>(() => engine.getState().explosions);
  const [score, setScore] = useState(0);
  const [fuel, setFuel] = useState(100);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [bestScore, setBestScore] = useLocalStorage(STORAGE_KEYS.APACHE_ATTACK, 0);
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
    setHeli({ ...state.heli });
    setTargets([...state.targets]);
    setBullets([...state.bullets]);
    setExplosions([...state.explosions]);
    setScore(state.score);
    setFuel(state.fuel);
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
        if (e.key === 'r' || e.key === 'R') {
          engine.shootRocket();
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

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
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
      gradient.addColorStop(0, '#1a3a1a');
      gradient.addColorStop(0.5, '#2d4a2d');
      gradient.addColorStop(1, '#1a1a0a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#3d5c3d';
      ctx.fillRect(0, CANVAS_HEIGHT - 60, CANVAS_WIDTH, 60);

      ctx.strokeStyle = '#4a6b4a';
      ctx.lineWidth = 1;
      for (let i = 0; i < CANVAS_WIDTH; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, CANVAS_HEIGHT - 60);
        ctx.lineTo(i + 20, CANVAS_HEIGHT);
        ctx.stroke();
      }

      targets.forEach(t => {
        const color = t.type === 'building' ? '#8B7355' : t.type === 'tank' ? '#4a5d4a' : '#556B2F';

        if (t.type === 'building') {
          ctx.fillStyle = color;
          ctx.fillRect(t.x, t.y, t.width, t.height);
          ctx.fillStyle = '#6B4423';
          ctx.fillRect(t.x + 10, t.y + 10, 15, 25);
          ctx.fillRect(t.x + 35, t.y + 10, 15, 25);
        } else if (t.type === 'tank') {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(t.x + t.width / 2, t.y + t.height - 15, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#3d4d3d';
          ctx.fillRect(t.x + 5, t.y, t.width - 10, t.height - 10);
          ctx.fillRect(t.x + t.width / 2 - 3, t.y - 20, 6, 25);
        } else {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(t.x + t.width / 2, t.y + t.height / 2, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#3d4d3d';
          ctx.fillRect(t.x + t.width / 2 - 5, t.y, 10, 15);
        }

        if (t.health < t.maxHealth) {
          const barWidth = t.width;
          const barHeight = 4;
          ctx.fillStyle = '#333';
          ctx.fillRect(t.x, t.y - 8, barWidth, barHeight);
          ctx.fillStyle = '#ff4444';
          ctx.fillRect(t.x, t.y - 8, barWidth * (t.health / t.maxHealth), barHeight);
        }
      });

      explosions.forEach(e => {
        const progress = e.frame / e.maxFrames;
        const alpha = 1 - progress;

        const explosionGradient = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius * (1 + progress));
        explosionGradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
        explosionGradient.addColorStop(0.3, `rgba(255, 150, 50, ${alpha})`);
        explosionGradient.addColorStop(0.7, `rgba(255, 80, 20, ${alpha * 0.7})`);
        explosionGradient.addColorStop(1, `rgba(50, 20, 0, 0)`);

        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * (1 + progress), 0, Math.PI * 2);
        ctx.fillStyle = explosionGradient;
        ctx.fill();
      });

      bullets.forEach(b => {
        if (b.isRocket) {
          ctx.fillStyle = '#ff4444';
          ctx.beginPath();
          ctx.moveTo(b.x + 5, b.y);
          ctx.lineTo(b.x - 5, b.y - 5);
          ctx.lineTo(b.x - 5, b.y + 5);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ffaa00';
          ctx.beginPath();
          ctx.arc(b.x - 8, b.y, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const bulletGradient = ctx.createLinearGradient(b.x, b.y + 5, b.x, b.y - 5);
          bulletGradient.addColorStop(0, '#ffff00');
          bulletGradient.addColorStop(1, '#ffaa00');
          ctx.fillStyle = bulletGradient;
          ctx.fillRect(b.x - 2, b.y - 6, 4, 12);
        }
      });

      if (gameState === 'playing') {
        ctx.save();
        ctx.translate(heli.x, heli.y);

        ctx.fillStyle = '#2d4a2d';
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#3d5c3d';
        ctx.beginPath();
        ctx.ellipse(0, 10, 15, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a3a1a';
        ctx.beginPath();
        ctx.ellipse(0, -5, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.moveTo(-40, -5);
        ctx.lineTo(40, -5);
        ctx.lineTo(35, 0);
        ctx.lineTo(-35, 0);
        ctx.closePath();
        ctx.fill();

        const bladeAngle = (Date.now() / 20) % 360;
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(0, -30);
          const angle = bladeAngle + i * 90;
          ctx.lineTo(Math.cos(angle * Math.PI / 180) * 25, -30 + Math.sin(angle * Math.PI / 180) * 5);
          ctx.stroke();
        }

        ctx.restore();
      }

      requestAnimationFrame(render);
    };

    render();
  }, [engine, gameState, heli, targets, bullets, explosions, width, height]);

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
            backgroundColor: 'rgba(26, 46, 26, 0.8)',
            color: '#4ecdc4',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 10px rgba(78, 205, 196, 0.3)',
            border: '1px solid rgba(78, 205, 196, 0.3)'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>分数</div>
          <div className="text-3xl font-bold" style={{ color: '#4ecdc4' }}>{score}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>波次</div>
          <div className="text-2xl font-bold" style={{ color: '#ff6b6b' }}>{wave}</div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>燃料</div>
          <div className="w-20 h-4 rounded-full overflow-hidden" style={{ backgroundColor: '#333' }}>
            <motion.div
              className="h-full"
              style={{
                backgroundColor: fuel > 30 ? '#4ecdc4' : fuel > 15 ? '#ffaa00' : '#ff4444',
                width: `${fuel}%`
              }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>最高</div>
          <div className="text-xl font-bold" style={{ color: '#4ecdc4' }}>{bestScore}</div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden cursor-crosshair"
        style={{
          boxShadow: '0 0 30px rgba(78, 205, 196, 0.3)',
          border: '2px solid rgba(78, 205, 196, 0.4)'
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
              style={{ backgroundColor: 'rgba(26, 46, 26, 0.95)', backdropFilter: 'blur(5px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🚁
              </motion.div>
              <div className="text-4xl font-bold mb-2" style={{ color: '#4ecdc4' }}>
                武装直升机
              </div>
              <div className="text-lg mb-8" style={{ color: '#88d8b0' }}>
                AH-64阿帕奇战斗模拟
              </div>
              <motion.button
                onClick={handleStart}
                className="px-8 py-4 rounded-xl text-xl font-bold mb-4"
                style={{
                  background: 'linear-gradient(135deg, #4ecdc4 0%, #26a69a 100%)',
                  color: '#1a3a1a',
                  boxShadow: '0 0 30px rgba(78, 205, 196, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开始任务
              </motion.button>
              <div className="text-sm opacity-60" style={{ color: '#aaaaaa' }}>
                空格开始 | 点击射击 | R发射火箭弹 | WASD移动
              </div>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(26, 46, 26, 0.95)', backdropFilter: 'blur(5px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-5xl font-bold mb-4" style={{ color: '#ff6b6b' }}>
                任务失败
              </div>
              <div className="text-3xl mb-2" style={{ color: '#ffd700' }}>
                得分: {score}
              </div>
              <div className="text-xl mb-2" style={{ color: '#4ecdc4' }}>
                波次: {wave}
              </div>
              {score >= bestScore && score > 0 && (
                <motion.div
                  className="text-xl mb-4"
                  style={{ color: '#ff6b6b' }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ type: 'spring' }}
                >
                  🎉 新纪录! 🎉
                </motion.div>
              )}
              <div className="text-xl mb-6" style={{ color: '#4ecdc4' }}>
                最高: {bestScore}
              </div>
              <motion.button
                onClick={handleRestart}
                className="px-8 py-4 rounded-xl text-xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #4ecdc4 0%, #26a69a 100%)',
                  color: '#1a3a1a',
                  boxShadow: '0 0 30px rgba(78, 205, 196, 0.5)'
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

      <div className="text-center opacity-60 text-sm" style={{ color: '#4ecdc4' }}>
        <div>WASD 移动 | 鼠标瞄准 | 点击 射击 | R 火箭弹</div>
      </div>
    </div>
  );
}
