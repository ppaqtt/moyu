import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { DOGFIGHT_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { DogfightEngine, Bullet, EnemyPlane, Explosion, SmokeTrail } from './engine';

const { PLANE_SIZE } = DOGFIGHT_CONSTANTS;

const BG_GRADIENT = 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 50%, #0a1628 100%)';

export default function Dogfight() {
  const navigate = useNavigate();
  const [engine] = useState(() => new DogfightEngine());
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [player, setPlayer] = useState(() => engine.getState().player);
  const [enemies, setEnemies] = useState<EnemyPlane[]>(() => engine.getState().enemies);
  const [bullets, setBullets] = useState<Bullet[]>(() => engine.getState().bullets);
  const [explosions, setExplosions] = useState<Explosion[]>(() => engine.getState().explosions);
  const [smokeTrails, setSmokeTrails] = useState<SmokeTrail[]>(() => engine.getState().smokeTrails);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [bestScore, setBestScore] = useLocalStorage(STORAGE_KEYS.DOGFIGHT, 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const lastShotRef = useRef(0);
  const { width, height } = engine.getCanvasSize();

  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setEnemies([...state.enemies]);
    setBullets([...state.bullets]);
    setExplosions([...state.explosions]);
    setSmokeTrails([...state.smokeTrails]);
    setScore(state.score);
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
        if (now - lastShotRef.current > 100) {
          engine.shoot();
          lastShotRef.current = now;
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

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#0a1628');
      gradient.addColorStop(0.5, '#1a2a4a');
      gradient.addColorStop(1, '#0a1628');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 60; i++) {
        const x = (Date.now() * 0.01 + i * 50) % (width + 20) - 10;
        const y = (i * 37) % height;
        ctx.beginPath();
        ctx.arc(x, y, 1 + Math.random(), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.4})`;
        ctx.fill();
      }

      smokeTrails.forEach(s => {
        const alpha = 1 - s.age / s.maxAge;
        const size = 8 + s.age / s.maxAge * 10;
        ctx.beginPath();
        ctx.arc(s.x, s.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 200, 200, ${alpha * 0.5})`;
        ctx.fill();
      });

      explosions.forEach(e => {
        const progress = e.frame / e.maxFrames;
        const alpha = 1 - progress;

        const explosionGradient = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius * (1 + progress * 0.5));
        explosionGradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
        explosionGradient.addColorStop(0.3, `rgba(255, 150, 50, ${alpha})`);
        explosionGradient.addColorStop(0.7, `rgba(255, 80, 20, ${alpha * 0.7})`);
        explosionGradient.addColorStop(1, `rgba(50, 20, 0, 0)`);

        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * (1 + progress * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = explosionGradient;
        ctx.fill();
      });

      bullets.forEach(b => {
        ctx.beginPath();
        if (b.isEnemy) {
          ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#ff4444';
        } else {
          ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#ffff00';
        }
        ctx.fill();

        ctx.strokeStyle = b.isEnemy ? '#ffaaaa' : '#ffffaa';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - b.vx * 3, b.y - b.vy * 3);
        ctx.stroke();
      });

      enemies.forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);

        const color = e.type === 'elite' ? '#ff4444' : e.type === 'ace' ? '#ff8800' : '#ffaa00';

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(PLANE_SIZE, 0);
        ctx.lineTo(-PLANE_SIZE * 0.5, -PLANE_SIZE * 0.4);
        ctx.lineTo(-PLANE_SIZE * 0.3, 0);
        ctx.lineTo(-PLANE_SIZE * 0.5, PLANE_SIZE * 0.4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#cc3333';
        ctx.fillRect(-PLANE_SIZE * 0.5, -PLANE_SIZE * 0.2, PLANE_SIZE * 0.4, PLANE_SIZE * 0.4);

        if (e.boosting) {
          ctx.fillStyle = '#ff8800';
          ctx.beginPath();
          ctx.moveTo(-PLANE_SIZE * 0.3, 0);
          ctx.lineTo(-PLANE_SIZE * 0.8, -PLANE_SIZE * 0.15);
          ctx.lineTo(-PLANE_SIZE * 0.8, PLANE_SIZE * 0.15);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();

        if (e.health < e.maxHealth) {
          const barWidth = PLANE_SIZE * 1.5;
          ctx.fillStyle = '#333';
          ctx.fillRect(e.x - barWidth / 2, e.y - PLANE_SIZE - 15, barWidth, 5);
          ctx.fillStyle = '#ff4444';
          ctx.fillRect(e.x - barWidth / 2, e.y - PLANE_SIZE - 15, barWidth * (e.health / e.maxHealth), 5);
        }
      });

      if (gameState === 'playing') {
        const invincible = player.invincibleTime > 0 && Math.floor(player.invincibleTime / 3) % 2 === 0;

        if (!invincible) {
          ctx.save();
          ctx.translate(player.x, player.y);
          ctx.rotate(player.angle);

          const boosting = keysRef.current.has('Shift') && player.boost > 0;
          const accelerating = keysRef.current.has('ArrowUp') || keysRef.current.has('w') || keysRef.current.has('W');

          ctx.fillStyle = '#00aaff';
          ctx.beginPath();
          ctx.moveTo(PLANE_SIZE, 0);
          ctx.lineTo(-PLANE_SIZE * 0.5, -PLANE_SIZE * 0.5);
          ctx.lineTo(-PLANE_SIZE * 0.3, 0);
          ctx.lineTo(-PLANE_SIZE * 0.5, PLANE_SIZE * 0.5);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#0088cc';
          ctx.fillRect(-PLANE_SIZE * 0.5, -PLANE_SIZE * 0.25, PLANE_SIZE * 0.4, PLANE_SIZE * 0.5);

          if (boosting && accelerating) {
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.moveTo(-PLANE_SIZE * 0.3, 0);
            ctx.lineTo(-PLANE_SIZE * 1.2, -PLANE_SIZE * 0.2);
            ctx.lineTo(-PLANE_SIZE * 1.2, PLANE_SIZE * 0.2);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(-PLANE_SIZE * 0.3, 0);
            ctx.lineTo(-PLANE_SIZE * 0.9, -PLANE_SIZE * 0.1);
            ctx.lineTo(-PLANE_SIZE * 0.9, PLANE_SIZE * 0.1);
            ctx.closePath();
            ctx.fill();
          }

          ctx.restore();
        }
      }

      requestAnimationFrame(render);
    };

    render();
  }, [engine, gameState, player, enemies, bullets, explosions, smokeTrails, width, height]);

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
            backgroundColor: 'rgba(26, 46, 74, 0.8)',
            color: '#00aaff',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 10px rgba(0, 170, 255, 0.3)',
            border: '1px solid rgba(0, 170, 255, 0.3)'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>分数</div>
          <div className="text-3xl font-bold" style={{ color: '#00aaff' }}>{score}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>波次</div>
          <div className="text-2xl font-bold" style={{ color: '#ff8800' }}>{wave}</div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>生命</div>
          <div className="w-20 h-4 rounded-full overflow-hidden" style={{ backgroundColor: '#333' }}>
            <motion.div
              className="h-full"
              style={{
                backgroundColor: player.health > 50 ? '#00ff00' : player.health > 25 ? '#ffaa00' : '#ff4444',
                width: `${player.health}%`
              }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>最高</div>
          <div className="text-xl font-bold" style={{ color: '#00aaff' }}>{bestScore}</div>
        </div>
      </div>

      {gameState === 'playing' && (
        <div className="flex items-center gap-4 px-4">
          <div className="flex flex-col items-center">
            <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>加速</div>
            <div className="w-20 h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#333' }}>
              <motion.div
                className="h-full"
                style={{ backgroundColor: '#00ffff', width: `${player.boost}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>
        </div>
      )}

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          boxShadow: '0 0 30px rgba(0, 170, 255, 0.3)',
          border: '2px solid rgba(0, 170, 255, 0.4)'
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
              style={{ backgroundColor: 'rgba(10, 22, 40, 0.95)', backdropFilter: 'blur(5px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✈️
              </motion.div>
              <div className="text-4xl font-bold mb-2" style={{ color: '#00aaff' }}>
                飞机大战
              </div>
              <div className="text-lg mb-8" style={{ color: '#88ccff' }}>
                战斗机狗斗模拟
              </div>
              <motion.button
                onClick={handleStart}
                className="px-8 py-4 rounded-xl text-xl font-bold mb-4"
                style={{
                  background: 'linear-gradient(135deg, #00aaff 0%, #0066aa 100%)',
                  color: '#ffffff',
                  boxShadow: '0 0 30px rgba(0, 170, 255, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开始战斗
              </motion.button>
              <div className="text-sm opacity-60" style={{ color: '#aaaaaa' }}>
                空格开始 | AD/左右 转向 | W/上 加速 | S/下 减速 | Shift 加速冲刺
              </div>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(10, 22, 40, 0.95)', backdropFilter: 'blur(5px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-5xl font-bold mb-4" style={{ color: '#ff4444' }}>
                被击落
              </div>
              <div className="text-3xl mb-2" style={{ color: '#ffd700' }}>
                得分: {score}
              </div>
              <div className="text-xl mb-2" style={{ color: '#00aaff' }}>
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
              <div className="text-xl mb-6" style={{ color: '#00aaff' }}>
                最高: {bestScore}
              </div>
              <motion.button
                onClick={handleRestart}
                className="px-8 py-4 rounded-xl text-xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #00aaff 0%, #0066aa 100%)',
                  color: '#ffffff',
                  boxShadow: '0 0 30px rgba(0, 170, 255, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                再次起飞
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-center opacity-60 text-sm" style={{ color: '#00aaff' }}>
        <div>AD/←→ 转向 | W/↑ 加速 | S/↓ 减速 | Shift 加速冲刺 | 空格 射击</div>
      </div>
    </div>
  );
}
