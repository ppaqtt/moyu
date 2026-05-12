import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { HeliCombatEngine, Player, Enemy, Bullet, Explosion } from './engine';
import { useNavigate } from 'react-router-dom';

const BG_GRADIENT = 'linear-gradient(180deg, #1a3a1a 0%, #0d1f0d 50%, #0a150a 100%)';

export default function HeliCombat() {
  const navigate = useNavigate();
  const [engine] = useState(() => new HeliCombatEngine());
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [player, setPlayer] = useState<Player>(() => engine.getState().player);
  const [enemies, setEnemies] = useState<Enemy[]>(() => engine.getState().enemies);
  const [playerBullets, setPlayerBullets] = useState<Bullet[]>(() => engine.getState().playerBullets);
  const [enemyBullets, setEnemyBullets] = useState<Bullet[]>(() => engine.getState().enemyBullets);
  const [explosions, setExplosions] = useState<Explosion[]>(() => engine.getState().explosions);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [bestScore, setBestScore] = useLocalStorage('helicombat_highscore', 0);
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
      gradient.addColorStop(0, '#1a3a1a');
      gradient.addColorStop(0.3, '#0d1f0d');
      gradient.addColorStop(0.7, '#0a150a');
      gradient.addColorStop(1, '#050a05');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 30; i++) {
        const x = (i * 53 + Date.now() * 0.01) % width;
        const y = (i * 37 + Date.now() * 0.02) % height;
        const size = 1 + Math.random() * 2;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 255, 100, 0.3)`;
        ctx.fill();
      }

      const groundGradient = ctx.createLinearGradient(0, height - 80, 0, height);
      groundGradient.addColorStop(0, '#2d4a2d');
      groundGradient.addColorStop(1, '#1a2e1a');
      ctx.fillStyle = groundGradient;
      ctx.fillRect(0, height - 80, width, 80);

      ctx.strokeStyle = '#3d5a3d';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, height - 80);
        ctx.lineTo(x, height);
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
        ctx.fillStyle = `rgba(255, 255, 150, ${alpha})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      });

      playerBullets.forEach(b => {
        if (b.type === 'rocket') {
          ctx.fillStyle = '#ff4400';
          ctx.fillRect(b.x, b.y, b.width, b.height);
          
          ctx.beginPath();
          ctx.moveTo(b.x, b.y + b.height);
          ctx.lineTo(b.x + b.width / 2, b.y + b.height + 10 + Math.random() * 5);
          ctx.lineTo(b.x + b.width, b.y + b.height);
          ctx.closePath();
          ctx.fillStyle = '#ffff00';
          ctx.fill();
        } else {
          const bulletGradient = ctx.createLinearGradient(b.x, b.y + b.height, b.x, b.y);
          bulletGradient.addColorStop(0, '#ffff00');
          bulletGradient.addColorStop(1, '#ff8800');
          ctx.fillStyle = bulletGradient;
          ctx.fillRect(b.x, b.y, b.width, b.height);
        }
      });

      enemyBullets.forEach(b => {
        const bulletGradient = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.height);
        bulletGradient.addColorStop(0, '#ff0000');
        bulletGradient.addColorStop(1, '#880000');
        ctx.fillStyle = bulletGradient;
        ctx.fillRect(b.x, b.y, b.width, b.height);
      });

      enemies.forEach(e => {
        const bodyGradient = ctx.createLinearGradient(e.x, e.y, e.x, e.y + e.height);
        
        if (e.type === 'tank') {
          bodyGradient.addColorStop(0, '#556b2f');
          bodyGradient.addColorStop(1, '#3d4f22');
          ctx.fillStyle = bodyGradient;
          ctx.fillRect(e.x + 5, e.y + e.height * 0.3, e.width - 10, e.height * 0.5);
          ctx.fillRect(e.x, e.y + e.height * 0.5, e.width, e.height * 0.3);
          ctx.fillStyle = '#2d3a15';
          ctx.fillRect(e.x + e.width / 2 - 3, e.y, 6, e.height * 0.4);
        } else if (e.type === 'uav') {
          bodyGradient.addColorStop(0, '#808080');
          bodyGradient.addColorStop(1, '#4a4a4a');
          ctx.fillStyle = bodyGradient;
          ctx.beginPath();
          ctx.ellipse(e.x + e.width / 2, e.y + e.height / 2, e.width / 2, e.height / 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(e.x + e.width * 0.3, e.y + e.height * 0.4, 2, 0, Math.PI * 2);
          ctx.arc(e.x + e.width * 0.7, e.y + e.height * 0.4, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === 'bunker') {
          bodyGradient.addColorStop(0, '#696969');
          bodyGradient.addColorStop(1, '#4a4a4a');
          ctx.fillStyle = bodyGradient;
          ctx.fillRect(e.x, e.y + e.height * 0.2, e.width, e.height * 0.8);
          ctx.fillStyle = '#3a3a3a';
          ctx.beginPath();
          ctx.arc(e.x + e.width / 2, e.y + e.height * 0.3, 8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          bodyGradient.addColorStop(0, '#556b2f');
          bodyGradient.addColorStop(1, '#3d4f22');
          ctx.fillStyle = bodyGradient;
          ctx.beginPath();
          ctx.arc(e.x + e.width / 2, e.y + e.height / 2, e.width / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        if (e.health < e.maxHealth) {
          const healthBarWidth = e.width;
          const healthBarHeight = 3;
          const healthPercent = e.health / e.maxHealth;
          ctx.fillStyle = '#333';
          ctx.fillRect(e.x, e.y - 6, healthBarWidth, healthBarHeight);
          ctx.fillStyle = '#00ff00';
          ctx.fillRect(e.x, e.y - 6, healthBarWidth * healthPercent, healthBarHeight);
        }
      });

      const state = engine.getState();
      const p = state.player;

      if (gameState === 'playing') {
        const alpha = state.invincibleTime > 0 && Math.floor(state.invincibleTime / 4) % 2 === 0 ? 0.5 : 1;
        ctx.globalAlpha = alpha;

        ctx.fillStyle = '#2d5a2d';
        ctx.beginPath();
        ctx.ellipse(p.x + p.width / 2, p.y + p.height * 0.7, p.width * 0.8, p.height * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#3d6a3d';
        ctx.beginPath();
        ctx.ellipse(p.x + p.width / 2, p.y + p.height * 0.5, p.width * 0.5, p.height * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a3a1a';
        ctx.beginPath();
        ctx.ellipse(p.x + p.width / 2, p.y + p.height * 0.35, p.width * 0.15, p.height * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        const rotorAngle = Date.now() / 30;
        ctx.strokeStyle = '#4a7a4a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x + p.width * 0.2, p.y + p.height * 0.25);
        ctx.lineTo(p.x + p.width * 0.2 + Math.cos(rotorAngle) * p.width * 0.6, p.y + p.height * 0.25 + Math.sin(rotorAngle) * 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p.x + p.width * 0.2, p.y + p.height * 0.25);
        ctx.lineTo(p.x + p.width * 0.2 + Math.cos(rotorAngle + Math.PI) * p.width * 0.6, p.y + p.height * 0.25 + Math.sin(rotorAngle + Math.PI) * 5);
        ctx.stroke();

        ctx.strokeStyle = '#4a7a4a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x - 15, p.y + p.height * 0.5);
        ctx.lineTo(p.x, p.y + p.height * 0.5);
        ctx.lineTo(p.x + 10, p.y + p.height * 0.7);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p.x + p.width + 15, p.y + p.height * 0.5);
        ctx.lineTo(p.x + p.width, p.y + p.height * 0.5);
        ctx.lineTo(p.x + p.width - 10, p.y + p.height * 0.7);
        ctx.stroke();

        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(p.x + p.width * 0.35, p.y + p.height * 0.4, 3, 0, Math.PI * 2);
        ctx.arc(p.x + p.width * 0.65, p.y + p.height * 0.4, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(p.x + p.width * 0.4, p.y + p.height);
        ctx.lineTo(p.x + p.width * 0.5, p.y + p.height + 20 + Math.random() * 10);
        ctx.lineTo(p.x + p.width * 0.6, p.y + p.height);
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 1;
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

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[600px] px-4">
        <motion.button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{
            backgroundColor: 'rgba(26, 46, 26, 0.8)',
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
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>导弹</div>
          <div className="text-xl font-bold" style={{ color: '#ff4400' }}>{player.rockets}/{player.maxRockets}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>最高</div>
          <div className="text-xl font-bold" style={{ color: '#00d2ff' }}>{bestScore}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4" style={{ width: '600px' }}>
        <div className="text-sm" style={{ color: '#ffd700' }}>血量</div>
        <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div
            className="h-full transition-all duration-200"
            style={{
              width: `${healthPercent}%`,
              background: healthPercent > 50 ? 'linear-gradient(90deg, #00ff00, #88ff00)' :
                         healthPercent > 25 ? 'linear-gradient(90deg, #ff8800, #ffff00)' :
                         'linear-gradient(90deg, #ff0000, #ff4400)'
            }}
          />
        </div>
        <div className="text-sm font-bold" style={{ color: healthPercent > 50 ? '#00ff00' : healthPercent > 25 ? '#ff8800' : '#ff0000' }}>
          {player.health}%
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
              style={{ backgroundColor: 'rgba(10, 21, 10, 0.95)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-7xl mb-6"
                animate={{ y: [0, -10, 0], rotate: [-5, 5, -5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🚁
              </motion.div>
              <div className="text-4xl font-bold mb-3" style={{ color: '#00ff00' }}>
                直升机战斗
              </div>
              <div className="text-lg mb-2" style={{ color: '#ffd700' }}>
                驾驶阿帕奇武装直升机
              </div>
              <div className="text-sm mb-8" style={{ color: '#888888' }}>
                消灭地面和空中敌人
              </div>
              <motion.button
                onClick={handleStart}
                className="px-10 py-4 rounded-xl text-xl font-bold mb-4"
                style={{
                  background: 'linear-gradient(135deg, #00ff00 0%, #88ff00 100%)',
                  color: '#0a150a',
                  boxShadow: '0 0 30px rgba(0, 255, 0, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开始战斗
              </motion.button>
              <div className="text-sm opacity-60" style={{ color: '#aaaaaa' }}>
                方向键/WASD移动 | 空格发射 | Shift发射导弹
              </div>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(10, 21, 10, 0.95)', backdropFilter: 'blur(8px)' }}
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
                任务失败
              </div>
              <div className="text-3xl mb-2" style={{ color: '#ffd700' }}>
                得分: {score}
              </div>
              <div className="text-lg mb-2" style={{ color: '#00ff00' }}>
                等级: {level}
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
              <div className="text-xl mb-6" style={{ color: '#00d2ff' }}>
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
                再次挑战
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-6 mt-2 text-xs" style={{ color: '#aaaaaa' }}>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ff4400' }}>🚀</span>
          <span>Shift发射导弹</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#00ff00' }}>空格</span>
          <span>机炮</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#556b2f' }}>🎯</span>
          <span>消灭敌人获取分数</span>
        </div>
      </div>
    </div>
  );
}
