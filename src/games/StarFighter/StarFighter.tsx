import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { StarFighterEngine, Player, Enemy, Bullet, Explosion } from './engine';
import { useNavigate } from 'react-router-dom';

const BG_GRADIENT = 'linear-gradient(180deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%)';

export default function StarFighter() {
  const navigate = useNavigate();
  const [engine] = useState(() => new StarFighterEngine());
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [player, setPlayer] = useState<Player>(() => engine.getState().player);
  const [enemies, setEnemies] = useState<Enemy[]>(() => engine.getState().enemies);
  const [playerBullets, setPlayerBullets] = useState<Bullet[]>(() => engine.getState().playerBullets);
  const [enemyBullets, setEnemyBullets] = useState<Bullet[]>(() => engine.getState().enemyBullets);
  const [explosions, setExplosions] = useState<Explosion[]>(() => engine.getState().explosions);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [energy, setEnergy] = useState(100);
  const [boost, setBoost] = useState(100);
  const [bestScore, setBestScore] = useLocalStorage('starfighter_highscore', 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const { width, height } = engine.getCanvasSize();

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setEnemies([...state.enemies]);
    setPlayerBullets([...state.playerBullets]);
    setEnemyBullets([...state.enemyBullets]);
    setExplosions([...state.explosions]);
    setScore(state.score);
    setLevel(state.level);
    setEnergy(state.energy);
    setBoost(state.boost);

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
      gradient.addColorStop(0, '#0a0a1a');
      gradient.addColorStop(0.5, '#1a0a2e');
      gradient.addColorStop(1, '#0a0a1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 80; i++) {
        const x = (i * 37 + Date.now() * 0.02) % width;
        const y = (i * 29 + Date.now() * 0.03) % height;
        const size = 0.5 + Math.random() * 1.5;
        const opacity = 0.3 + Math.random() * 0.7;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }

      const nebulaGradient = ctx.createRadialGradient(width * 0.3, height * 0.4, 0, width * 0.3, height * 0.4, 200);
      nebulaGradient.addColorStop(0, 'rgba(100, 0, 150, 0.1)');
      nebulaGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = nebulaGradient;
      ctx.fillRect(0, 0, width, height);

      const nebulaGradient2 = ctx.createRadialGradient(width * 0.7, height * 0.6, 0, width * 0.7, height * 0.6, 150);
      nebulaGradient2.addColorStop(0, 'rgba(0, 100, 150, 0.1)');
      nebulaGradient2.addColorStop(1, 'transparent');
      ctx.fillStyle = nebulaGradient2;
      ctx.fillRect(0, 0, width, height);

      explosions.forEach(exp => {
        const progress = exp.frame / exp.maxFrames;
        const radius = progress * exp.size;
        const alpha = 1 - progress;

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.3})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.5})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 255, 255, ${alpha * 0.8})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      });

      playerBullets.forEach(b => {
        if (b.type === 'plasma') {
          const bulletGradient = ctx.createLinearGradient(b.x, b.y + b.height, b.x, b.y);
          bulletGradient.addColorStop(0, '#00ffff');
          bulletGradient.addColorStop(0.5, '#00d2ff');
          bulletGradient.addColorStop(1, '#0088ff');
          ctx.fillStyle = bulletGradient;
          ctx.beginPath();
          ctx.ellipse(b.x + b.width / 2, b.y + b.height / 2, b.width / 2, b.height / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#00ffff';
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (b.type === 'laser') {
          ctx.fillStyle = '#ff00ff';
          ctx.fillRect(b.x, b.y, b.width, b.height);
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#ff00ff';
          ctx.fillRect(b.x, b.y, b.width, b.height);
          ctx.shadowBlur = 0;
        } else if (b.type === 'missile') {
          ctx.save();
          ctx.translate(b.x + b.width / 2, b.y + b.height / 2);
          ctx.rotate(Math.atan2(b.dy, b.dx) + Math.PI / 2);
          
          ctx.fillStyle = '#ff6600';
          ctx.fillRect(-3, -5, 6, 10);
          ctx.fillStyle = '#ffff00';
          ctx.beginPath();
          ctx.moveTo(-2, 5);
          ctx.lineTo(0, 12 + Math.random() * 5);
          ctx.lineTo(2, 5);
          ctx.closePath();
          ctx.fill();
          
          ctx.restore();
        }
      });

      enemyBullets.forEach(b => {
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ff0000';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      enemies.forEach(e => {
        ctx.save();
        ctx.translate(e.x + e.width / 2, e.y + e.height / 2);
        ctx.rotate(e.angle);

        const bodyGradient = ctx.createLinearGradient(-e.width / 2, -e.height / 2, e.width / 2, e.height / 2);
        
        if (e.type === 'destroyer') {
          bodyGradient.addColorStop(0, '#8b0000');
          bodyGradient.addColorStop(0.5, '#ff0000');
          bodyGradient.addColorStop(1, '#8b0000');
          ctx.fillStyle = bodyGradient;
          ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);
          ctx.fillStyle = '#ff3333';
          ctx.fillRect(-e.width / 4, -e.height / 3, e.width / 2, e.height / 1.5);
        } else if (e.type === 'cruiser') {
          bodyGradient.addColorStop(0, '#4b0082');
          bodyGradient.addColorStop(1, '#9400d3');
          ctx.fillStyle = bodyGradient;
          ctx.beginPath();
          ctx.moveTo(0, -e.height / 2);
          ctx.lineTo(e.width / 2, e.height / 2);
          ctx.lineTo(0, e.height / 3);
          ctx.lineTo(-e.width / 2, e.height / 2);
          ctx.closePath();
          ctx.fill();
        } else if (e.type === 'fighter') {
          bodyGradient.addColorStop(0, '#ff4500');
          bodyGradient.addColorStop(1, '#ff6347');
          ctx.fillStyle = bodyGradient;
          ctx.beginPath();
          ctx.moveTo(0, -e.height / 2);
          ctx.lineTo(e.width / 2, e.height / 2);
          ctx.lineTo(-e.width / 2, e.height / 2);
          ctx.closePath();
          ctx.fill();
        } else {
          bodyGradient.addColorStop(0, '#ff1493');
          bodyGradient.addColorStop(1, '#ff69b4');
          ctx.fillStyle = bodyGradient;
          ctx.beginPath();
          ctx.arc(0, 0, e.width / 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -e.height / 6, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        if (e.health < e.maxHealth) {
          const healthBarWidth = e.width;
          const healthBarHeight = 3;
          const healthPercent = e.health / e.maxHealth;
          ctx.fillStyle = '#333';
          ctx.fillRect(e.x, e.y - 8, healthBarWidth, healthBarHeight);
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(e.x, e.y - 8, healthBarWidth * healthPercent, healthBarHeight);
        }
      });

      const state = engine.getState();
      const p = state.player;

      if (gameState === 'playing') {
        ctx.save();
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
        ctx.rotate(p.angle);

        if (state.invincibleTime > 0 && Math.floor(state.invincibleTime / 4) % 2 === 0) {
          ctx.globalAlpha = 0.5;
        }

        const shipGradient = ctx.createLinearGradient(0, -p.height / 2, 0, p.height / 2);
        shipGradient.addColorStop(0, '#00ffff');
        shipGradient.addColorStop(0.5, '#0088ff');
        shipGradient.addColorStop(1, '#004488');
        ctx.fillStyle = shipGradient;

        ctx.beginPath();
        ctx.moveTo(0, -p.height / 2);
        ctx.lineTo(p.width / 3, p.height / 3);
        ctx.lineTo(0, p.height / 2);
        ctx.lineTo(-p.width / 3, p.height / 3);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#88ddff';
        ctx.beginPath();
        ctx.moveTo(0, -p.height / 3);
        ctx.lineTo(p.width / 6, p.height / 6);
        ctx.lineTo(-p.width / 6, p.height / 6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -p.height / 8, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(0, 255, 255, ${0.5 + Math.random() * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(-p.width / 6, p.height / 3);
        ctx.lineTo(0, p.height / 2 + 15 + Math.random() * 10);
        ctx.lineTo(p.width / 6, p.height / 3);
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.restore();

        if (p.shield > 0) {
          ctx.beginPath();
          ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 200, 255, ${0.3 + Math.random() * 0.2})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [engine, gameState, player, enemies, playerBullets, enemyBullets, explosions, width, height]);

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

    const handleClick = () => {
      if (gameState === 'playing') {
        engine.shootPlasma();
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

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
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

  const healthPercent = (player.health / player.maxHealth) * 100;
  const shieldPercent = (player.shield / player.maxShield) * 100;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[600px] px-4">
        <motion.button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{
            backgroundColor: 'rgba(10, 10, 26, 0.8)',
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
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>等级</div>
          <div className="text-2xl font-bold" style={{ color: '#ff00ff' }}>{level}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>最高</div>
          <div className="text-xl font-bold" style={{ color: '#88ff00' }}>{bestScore}</div>
        </div>
      </div>

      <div className="flex gap-4 px-4" style={{ width: '600px' }}>
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: '#ff4444' }}>生命</span>
            <span>{player.health}/{player.maxHealth}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="h-full transition-all" style={{ width: `${healthPercent}%`, backgroundColor: '#ff4444' }} />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: '#00d2ff' }}>护盾</span>
            <span>{player.shield}/{player.maxShield}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="h-full transition-all" style={{ width: `${shieldPercent}%`, backgroundColor: '#00d2ff' }} />
          </div>
        </div>
        <div className="w-20">
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: '#ff8800' }}>推进</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="h-full transition-all" style={{ width: `${boost}%`, backgroundColor: '#ff8800' }} />
          </div>
        </div>
      </div>

      <div className="flex gap-4 px-4 text-xs" style={{ width: '600px' }}>
        <div className="flex items-center gap-1">
          <span style={{ color: '#00ffff' }}>1</span>
          <span>等离子炮</span>
          <div className="w-16 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <div className="h-full" style={{ width: `${player.weapons.plasma}%`, backgroundColor: '#00ffff' }} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ff00ff' }}>2</span>
          <span>激光</span>
          <div className="w-16 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <div className="h-full" style={{ width: `${player.weapons.laser}%`, backgroundColor: '#ff00ff' }} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ff6600' }}>3</span>
          <span>导弹</span>
          <div className="w-16 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <div className="h-full" style={{ width: `${player.weapons.missile}%`, backgroundColor: '#ff6600' }} />
          </div>
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
              style={{ backgroundColor: 'rgba(10, 10, 26, 0.95)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-7xl mb-6"
                animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🚀
              </motion.div>
              <div className="text-4xl font-bold mb-3" style={{ color: '#00ffff' }}>
                星际战机
              </div>
              <div className="text-lg mb-2" style={{ color: '#ffd700' }}>
                驾驶星际战斗机
              </div>
              <div className="text-sm mb-8" style={{ color: '#888888' }}>
                在银河系中消灭外星入侵者
              </div>
              <motion.button
                onClick={handleStart}
                className="px-10 py-4 rounded-xl text-xl font-bold mb-4"
                style={{
                  background: 'linear-gradient(135deg, #00ffff 0%, #ff00ff 100%)',
                  color: '#0a0a1a',
                  boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                起飞
              </motion.button>
              <div className="text-sm opacity-60" style={{ color: '#aaaaaa' }}>
                WASD/方向键移动 | 鼠标瞄准 | 点击/1等离子 | 2激光 | 3导弹 | Shift加速
              </div>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(10, 10, 26, 0.95)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 1 }}
              >
                💥
              </motion.div>
              <div className="text-5xl font-bold mb-4" style={{ color: '#ff4444' }}>
                任务失败
              </div>
              <div className="text-3xl mb-2" style={{ color: '#ffd700' }}>
                得分: {score}
              </div>
              <div className="text-lg mb-2" style={{ color: '#00ffff' }}>
                等级: {level}
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
              <div className="text-xl mb-6" style={{ color: '#88ff00' }}>
                最高: {bestScore}
              </div>
              <motion.button
                onClick={handleRestart}
                className="px-10 py-4 rounded-xl text-xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #ff00ff 0%, #00ffff 100%)',
                  color: '#0a0a1a',
                  boxShadow: '0 0 30px rgba(255, 0, 255, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                重新起飞
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-6 mt-2 text-xs" style={{ color: '#aaaaaa' }}>
        <div className="flex items-center gap-1">
          <span style={{ color: '#00ffff' }}>🚀</span>
          <span>等离子炮</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ff00ff' }}>⚡</span>
          <span>激光束</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ff6600' }}>🎯</span>
          <span>追踪导弹</span>
        </div>
      </div>
    </div>
  );
}
