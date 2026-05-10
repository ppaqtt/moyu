import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { AAMissileEngine, Missile, Target, Explosion } from './engine';
import { useNavigate } from 'react-router-dom';

const BG_GRADIENT = 'linear-gradient(180deg, #1a2a3a 0%, #0a1520 50%, #051015 100%)';

export default function AAMissile() {
  const navigate = useNavigate();
  const [engine] = useState(() => new AAMissileEngine());
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [playerMissiles, setPlayerMissiles] = useState<Missile[]>(() => engine.getState().playerMissiles);
  const [enemyMissiles, setEnemyMissiles] = useState<Missile[]>(() => engine.getState().enemyMissiles);
  const [enemyTargets, setEnemyTargets] = useState<Target[]>(() => engine.getState().enemyTargets);
  const [explosions, setExplosions] = useState<Explosion[]>(() => engine.getState().explosions);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(10);
  const [wave, setWave] = useState(1);
  const [accuracy, setAccuracy] = useState(0);
  const [bestScore, setBestScore] = useLocalStorage('aamissile_highscore', 0);
  const [mouseY, setMouseY] = useState(0);
  const [interceptRate, setInterceptRate] = useState(0.3);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width, height } = engine.getCanvasSize();

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setPlayerMissiles([...state.playerMissiles]);
    setEnemyMissiles([...state.enemyMissiles]);
    setEnemyTargets([...state.enemyTargets]);
    setExplosions([...state.explosions]);
    setScore(state.score);
    setLevel(state.level);
    setLives(state.lives);
    setWave(state.wave);
    setAccuracy(state.accuracy);
    setInterceptRate(state.interceptRate || 0.3);

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
      gradient.addColorStop(0, '#1a2a3a');
      gradient.addColorStop(0.5, '#0a1520');
      gradient.addColorStop(1, '#051015');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 50; i++) {
        const x = (i * 37 + Date.now() * 0.01) % width;
        const y = (i * 29 + Date.now() * 0.015) % height;
        const size = 0.5 + Math.random();
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, 0.5)`;
        ctx.fill();
      }

      const gridGradient = ctx.createLinearGradient(0, height * 0.5, 0, height);
      gridGradient.addColorStop(0, '#0a1520');
      gridGradient.addColorStop(1, '#1a3a2a');
      ctx.fillStyle = gridGradient;
      ctx.fillRect(0, height * 0.5, width, height * 0.5);

      ctx.strokeStyle = 'rgba(100, 150, 100, 0.3)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, height * 0.5);
        ctx.lineTo(x + (x - width / 2) * 0.3, height);
        ctx.stroke();
      }
      for (let y = height * 0.5; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      explosions.forEach(exp => {
        const progress = exp.frame / exp.maxFrames;
        const radius = progress * exp.size;
        const alpha = 1 - progress;

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 50, ${alpha * 0.5})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 100, 30, ${alpha * 0.7})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      });

      enemyTargets.forEach(target => {
        if (target.destroyed) return;

        ctx.save();
        ctx.translate(target.x + target.width / 2, target.y + target.height / 2);
        ctx.rotate(target.angle);

        const bodyGradient = ctx.createLinearGradient(-target.width / 2, 0, target.width / 2, 0);
        
        if (target.type === 'plane') {
          bodyGradient.addColorStop(0, '#4a5568');
          bodyGradient.addColorStop(0.5, '#718096');
          bodyGradient.addColorStop(1, '#4a5568');
          ctx.fillStyle = bodyGradient;
          ctx.fillRect(-target.width / 2, -target.height / 4, target.width, target.height / 2);
          ctx.fillRect(-target.width / 4, -target.height / 2, target.width / 2, target.height);
        } else if (target.type === 'helicopter') {
          bodyGradient.addColorStop(0, '#2d3748');
          bodyGradient.addColorStop(1, '#4a5568');
          ctx.fillStyle = bodyGradient;
          ctx.beginPath();
          ctx.ellipse(0, 0, target.width / 2, target.height / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#1a202c';
          ctx.fillRect(-target.width / 2 - 10, -2, 20, 4);
        } else if (target.type === 'drone') {
          bodyGradient.addColorStop(0, '#1a202c');
          bodyGradient.addColorStop(1, '#2d3748');
          ctx.fillStyle = bodyGradient;
          ctx.fillRect(-target.width / 2, -target.height / 2, target.width, target.height);
          ctx.fillRect(-target.width / 2 - 5, -target.height / 4, 5, target.height / 2);
          ctx.fillRect(target.width / 2, -target.height / 4, 5, target.height / 2);
        } else if (target.type === 'missile') {
          bodyGradient.addColorStop(0, '#e53e3e');
          bodyGradient.addColorStop(1, '#c53030');
          ctx.fillStyle = bodyGradient;
          ctx.fillRect(-target.width / 4, -target.height / 2, target.width / 2, target.height);
          ctx.fillStyle = '#fc8181';
          ctx.beginPath();
          ctx.moveTo(-target.width / 4, target.height / 2);
          ctx.lineTo(0, target.height / 2 + 8);
          ctx.lineTo(target.width / 4, target.height / 2);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      });

      playerMissiles.forEach(missile => {
        if (missile.status !== 'flying') return;

        ctx.save();
        ctx.translate(missile.x, missile.y);
        ctx.rotate(Math.atan2(missile.dy, missile.dx));

        const missileGradient = ctx.createLinearGradient(0, -3, 0, 3);
        missileGradient.addColorStop(0, '#00ff00');
        missileGradient.addColorStop(0.5, '#88ff88');
        missileGradient.addColorStop(1, '#00aa00');
        ctx.fillStyle = missileGradient;
        ctx.fillRect(-10, -3, 20, 6);

        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-15 - Math.random() * 5, 0);
        ctx.lineTo(-10, 3);
        ctx.closePath();
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-15 - Math.random() * 5, 0);
        ctx.lineTo(-10, -3);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 100);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
      });

      enemyMissiles.forEach(missile => {
        if (missile.status !== 'flying') return;

        ctx.save();
        ctx.translate(missile.x, missile.y);
        ctx.rotate(Math.atan2(missile.dy, missile.dx));

        const missileGradient = ctx.createLinearGradient(0, -2, 0, 2);
        missileGradient.addColorStop(0, '#ff0000');
        missileGradient.addColorStop(1, '#aa0000');
        ctx.fillStyle = missileGradient;
        ctx.fillRect(-8, -2, 16, 4);

        ctx.fillStyle = '#ff6666';
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-12 - Math.random() * 5, 0);
        ctx.lineTo(-8, 2);
        ctx.closePath();
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-12 - Math.random() * 5, 0);
        ctx.lineTo(-8, -2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      });

      const launcherX = width / 2;
      const launcherY = height - 50;

      ctx.fillStyle = '#2d3748';
      ctx.beginPath();
      ctx.moveTo(launcherX - 40, launcherY + 30);
      ctx.lineTo(launcherX + 40, launcherY + 30);
      ctx.lineTo(launcherX + 30, launcherY);
      ctx.lineTo(launcherX - 30, launcherY);
      ctx.closePath();
      ctx.fill();

      const launcherAngle = Math.min(Math.max(Math.atan2(mouseY - launcherY, width / 2 - launcherX), -Math.PI / 3), Math.PI / 6);
      ctx.save();
      ctx.translate(launcherX, launcherY);
      ctx.rotate(Math.min(Math.max(launcherAngle, -Math.PI / 3), Math.PI / 6));
      
      ctx.fillStyle = '#4a5568';
      ctx.fillRect(-5, -40, 10, 40);
      ctx.fillStyle = '#718096';
      ctx.beginPath();
      ctx.arc(0, -40, 8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();

      ctx.strokeStyle = `rgba(0, 255, 0, ${0.3 + Math.sin(Date.now() / 200) * 0.1})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(launcherX, launcherY, 150 + level * 10, -Math.PI, 0);
      ctx.stroke();

      ctx.fillStyle = `rgba(0, 255, 0, 0.1)`;
      ctx.beginPath();
      ctx.arc(launcherX, launcherY, 150 + level * 10, -Math.PI, 0);
      ctx.lineTo(launcherX, launcherY);
      ctx.closePath();
      ctx.fill();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [engine, gameState, playerMissiles, enemyMissiles, enemyTargets, explosions, width, height, level]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleY = height / rect.height;
      const y = (e.clientY - rect.top) * scaleY;
      setMouseY(y);
    };

    const handleClick = () => {
      if (gameState === 'idle') {
        engine.start();
        setGameState('playing');
      } else if (gameState === 'gameover') {
        engine.reset();
        setGameState('idle');
      } else if (gameState === 'playing') {
        engine.fireMissile();
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [engine, gameState, width, height]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'idle') {
          engine.start();
          setGameState('playing');
        } else if (gameState === 'gameover') {
          engine.reset();
          setGameState('idle');
        } else if (gameState === 'playing') {
          engine.fireMissile();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
            backgroundColor: 'rgba(26, 46, 58, 0.8)',
            color: '#00ff00',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)',
            border: '1px solid rgba(0, 255, 0, 0.3)'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>分数</div>
          <div className="text-3xl font-bold" style={{ color: '#00ff00' }}>{score}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>等级</div>
          <div className="text-2xl font-bold" style={{ color: '#ff8800' }}>{level}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>波次</div>
          <div className="text-2xl font-bold" style={{ color: '#00d2ff' }}>{wave}</div>
        </div>

        <div className="flex items-center gap-1">
          {[...Array(10)].map((_, i) => (
            <motion.span
              key={i}
              animate={{ scale: i < lives ? 1 : 0.5, opacity: i < lives ? 1 : 0.2 }}
              style={{ color: i < lives ? '#ff4444' : '#444' }}
            >
              ❤️
            </motion.span>
          ))}
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>最高</div>
          <div className="text-xl font-bold" style={{ color: '#a855f7' }}>{bestScore}</div>
        </div>
      </div>

      <div className="flex items-center gap-4 px-4 text-xs" style={{ width: '600px' }}>
        <div className="flex items-center gap-2">
          <span style={{ color: '#ffd700' }}>命中率:</span>
          <span style={{ color: accuracy > 70 ? '#00ff00' : accuracy > 40 ? '#ff8800' : '#ff4444' }}>
            {accuracy.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: '#ffd700' }}>雷达范围:</span>
          <span style={{ color: '#00d2ff' }}>{150 + level * 10}</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: '#ffd700' }}>拦截率:</span>
          <span style={{ color: '#00ff88' }}>{(interceptRate * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          boxShadow: '0 0 40px rgba(0, 255, 0, 0.3)',
          border: '2px solid rgba(0, 255, 0, 0.4)'
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
              style={{ backgroundColor: 'rgba(5, 15, 21, 0.95)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-7xl mb-6"
                animate={{ y: [0, -10, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🎯
              </motion.div>
              <div className="text-4xl font-bold mb-3" style={{ color: '#00ff00' }}>
                防空导弹
              </div>
              <div className="text-lg mb-2" style={{ color: '#ffd700' }}>
                指挥防空系统
              </div>
              <div className="text-sm mb-8" style={{ color: '#888888' }}>
                拦截来袭敌机和导弹
              </div>
              <motion.button
                onClick={handleStart}
                className="px-10 py-4 rounded-xl text-xl font-bold mb-4"
                style={{
                  background: 'linear-gradient(135deg, #00ff00 0%, #00aa00 100%)',
                  color: '#051015',
                  boxShadow: '0 0 30px rgba(0, 255, 0, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开始拦截
              </motion.button>
              <div className="text-sm opacity-60" style={{ color: '#aaaaaa' }}>
                点击/空格发射导弹 | 鼠标移动瞄准
              </div>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(5, 15, 21, 0.95)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                💥
              </motion.div>
              <div className="text-5xl font-bold mb-4" style={{ color: '#ff4444' }}>
                防线突破
              </div>
              <div className="text-3xl mb-2" style={{ color: '#ffd700' }}>
                得分: {score}
              </div>
              <div className="text-lg mb-2" style={{ color: '#00ff00' }}>
                等级: {level} | 波次: {wave} | 命中率: {accuracy.toFixed(1)}%
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
                  background: 'linear-gradient(135deg, #ff8800 0%, #ff4400 100%)',
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

      <div className="flex gap-6 mt-2 text-xs" style={{ color: '#aaaaaa' }}>
        <div className="flex items-center gap-1">
          <span style={{ color: '#4a5568' }}>✈️</span>
          <span>飞机</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#2d3748' }}>🚁</span>
          <span>直升机</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#1a202c' }}>🛸</span>
          <span>无人机</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#e53e3e' }}>🚀</span>
          <span>来袭导弹</span>
        </div>
      </div>
    </div>
  );
}
