import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { GEOMETRY_WARS_CONSTANTS } from '../../utils/geometryWarsConstants';
import { GeometryWarsEngine, Player, Enemy, Bullet, Particle, GridNode } from './engine';
import { useNavigate } from 'react-router-dom';

export default function GeometryWars() {
  const navigate = useNavigate();
  const [engine] = useState(() => new GeometryWarsEngine());
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [player, setPlayer] = useState<Player>(() => engine.getState().player);
  const [enemies, setEnemies] = useState<Enemy[]>(() => engine.getState().enemies);
  const [bullets, setBullets] = useState<Bullet[]>(() => engine.getState().bullets);
  const [particles, setParticles] = useState<Particle[]>(() => engine.getState().particles);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [bestScore, setBestScore] = useLocalStorage('geometryWars_highscore', 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const { width, height } = engine.getCanvasSize();

  const handleTick = useCallback(() => {
    keysRef.current.forEach(key => {
      engine.setKeyPressed(key, true);
    });
    engine.tick();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setEnemies([...state.enemies]);
    setBullets([...state.bullets]);
    setParticles([...state.particles]);
    setScore(state.score);
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
      ctx.fillStyle = '#000010';
      ctx.fillRect(0, 0, width, height);

      const state = engine.getState();

      state.grid.forEach(row => {
        row.forEach(node => {
          if (node.active) {
            ctx.fillStyle = `rgba(0, 255, 255, ${node.intensity * 0.3})`;
            ctx.fillRect(node.x, node.y, 38, 38);
          }
          ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
          ctx.lineWidth = 1;
          ctx.strokeRect(node.x, node.y, 38, 38);
        });
      });

      state.particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
      });

      state.bullets.forEach(b => {
        b.trail.forEach((pos, idx) => {
          const alpha = 1 - idx / b.trail.length;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, b.size * alpha, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
          ctx.fill();
        });

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });

      state.enemies.forEach(e => {
        if (e.spawnTimer > 0) return;

        const color = e.type === 'cube' ? '#00ffff' :
                      e.type === 'diamond' ? '#ff00ff' :
                      e.type === 'spinner' ? '#ffff00' :
                      e.type === 'worm' ? '#00ff00' : '#ff4444';

        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.fillStyle = color + '33';

        switch (e.type) {
          case 'cube':
            ctx.beginPath();
            ctx.rect(-e.size / 2, -e.size / 2, e.size, e.size);
            ctx.fill();
            ctx.stroke();
            break;
          case 'diamond':
            ctx.beginPath();
            ctx.moveTo(0, -e.size / 2);
            ctx.lineTo(e.size / 2, 0);
            ctx.lineTo(0, e.size / 2);
            ctx.lineTo(-e.size / 2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;
          case 'spinner':
            for (let i = 0; i < 4; i++) {
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(Math.cos(i * Math.PI / 2) * e.size, Math.sin(i * Math.PI / 2) * e.size);
              ctx.stroke();
            }
            ctx.beginPath();
            ctx.arc(0, 0, e.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
          case 'worm':
            ctx.beginPath();
            ctx.arc(0, 0, e.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(e.size * 0.6, 0, e.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
          case 'seeker':
            ctx.beginPath();
            ctx.moveTo(0, -e.size / 2);
            ctx.lineTo(e.size / 2, e.size / 2);
            ctx.lineTo(0, e.size / 3);
            ctx.lineTo(-e.size / 2, e.size / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;
        }

        ctx.restore();
      });

      const p = state.player;

      const alpha = p.invincibleTime > 0 && Math.floor(p.invincibleTime / 3) % 2 === 0 ? 0.5 : 1;
      ctx.globalAlpha = alpha;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#00ffff33';

      ctx.beginPath();
      ctx.moveTo(p.size, 0);
      ctx.lineTo(-p.size * 0.7, -p.size * 0.7);
      ctx.lineTo(-p.size * 0.3, 0);
      ctx.lineTo(-p.size * 0.7, p.size * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      ctx.globalAlpha = 1;

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [engine, gameState, width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      engine.setMousePosition(x, y);
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [engine, width, height]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.add(key);

      if (gameState === 'idle' || gameState === 'gameover') {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (gameState === 'idle') {
            engine.start();
            setGameState('playing');
          } else {
            engine.reset();
            setGameState('idle');
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.delete(key);
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
      <div className="flex items-center justify-between w-full max-w-[800px] px-4">
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
          <div className="text-3xl font-bold" style={{ color: '#00ffff' }}>{score}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>倍率</div>
          <div className="text-2xl font-bold" style={{ color: '#ff00ff' }}>x{player.multiplier.toFixed(1)}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>波次</div>
          <div className="text-2xl font-bold" style={{ color: '#00ff00' }}>{wave}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>敌人</div>
          <div className="text-xl font-bold" style={{ color: '#ff4444' }}>{enemies.length}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>最高</div>
          <div className="text-xl font-bold" style={{ color: '#ff00ff' }}>{bestScore}</div>
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
              style={{ backgroundColor: 'rgba(0, 0, 16, 0.95)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-7xl mb-6"
                animate={{ rotate: [0, 180, 360], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                💎
              </motion.div>
              <div className="text-4xl font-bold mb-3" style={{ color: '#00ffff' }}>
                几何战争
              </div>
              <div className="text-lg mb-2" style={{ color: '#ffd700' }}>
                在霓虹几何世界中生存
              </div>
              <div className="text-sm mb-8 opacity-70" style={{ color: '#aaa' }}>
                连续击杀获得分数倍率加成
              </div>
              <motion.button
                onClick={handleStart}
                className="px-10 py-4 rounded-xl text-xl font-bold mb-4"
                style={{
                  background: 'linear-gradient(135deg, #00ffff 0%, #ff00ff 100%)',
                  color: '#000010',
                  boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开始游戏
              </motion.button>
              <div className="text-sm opacity-60" style={{ color: '#aaa' }}>
                WASD移动 | 鼠标瞄准 | 自动射击 | 空格/回车开始
              </div>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(0, 0, 16, 0.95)', backdropFilter: 'blur(8px)' }}
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
                游戏结束
              </div>
              <div className="text-3xl mb-2" style={{ color: '#00ffff' }}>
                得分: {score}
              </div>
              <div className="text-lg mb-2" style={{ color: '#00ff00' }}>
                波次: {wave}
              </div>
              {score >= bestScore && score > 0 && (
                <motion.div
                  className="text-xl mb-4"
                  style={{ color: '#ff00ff' }}
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
                className="px-10 py-4 rounded-xl text-xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #ff00ff 0%, #00ffff 100%)',
                  color: '#000010',
                  boxShadow: '0 0 30px rgba(255, 0, 255, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                再来一局
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-center opacity-60 text-sm" style={{ color: '#ffd700' }}>
        <div>WASD移动 | 鼠标瞄准 | 自动射击</div>
      </div>

      <div className="flex gap-6 mt-2 text-xs" style={{ color: '#aaa' }}>
        <div className="flex items-center gap-1">
          <span style={{ color: '#00ffff' }}>■</span>
          <span>方块</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ff00ff' }}>◆</span>
          <span>菱形</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ffff00' }}>✕</span>
          <span>旋转者</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#00ff00' }}>○○</span>
          <span>蠕虫</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ff4444' }}>▲</span>
          <span>追踪者</span>
        </div>
      </div>
    </div>
  );
}
