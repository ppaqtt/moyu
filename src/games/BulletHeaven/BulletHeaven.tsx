import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { BULLET_HEAVEN_CONSTANTS } from '../../utils/bulletHeavenConstants';
import { BulletHeavenEngine, Player, Enemy, Bullet, PowerUp, Particle } from './engine';
import { useNavigate } from 'react-router-dom';

export default function BulletHeaven() {
  const navigate = useNavigate();
  const [engine] = useState(() => new BulletHeavenEngine());
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [player, setPlayer] = useState<Player>(() => engine.getState().player);
  const [enemies, setEnemies] = useState<Enemy[]>(() => engine.getState().enemies);
  const [playerBullets, setPlayerBullets] = useState<Bullet[]>(() => engine.getState().playerBullets);
  const [enemyBullets, setEnemyBullets] = useState<Bullet[]>(() => engine.getState().enemyBullets);
  const [powerUps, setPowerUps] = useState<PowerUp[]>(() => engine.getState().powerUps);
  const [particles, setParticles] = useState<Particle[]>(() => engine.getState().particles);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [survivalTime, setSurvivalTime] = useState(0);
  const [bestScore, setBestScore] = useLocalStorage('bulletHeaven_highscore', 0);
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
    setPlayerBullets([...state.playerBullets]);
    setEnemyBullets([...state.enemyBullets]);
    setPowerUps([...state.powerUps]);
    setParticles([...state.particles]);
    setScore(state.score);
    setLevel(state.level);
    setSurvivalTime(state.survivalTime);

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

      const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
      gradient.addColorStop(0, '#1a0a2e');
      gradient.addColorStop(0.5, '#16213e');
      gradient.addColorStop(1, '#0f0f1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 50; i++) {
        const x = (Date.now() * 0.02 + i * 37) % (width + 50) - 25;
        const y = (i * 53 + Date.now() * 0.03) % height;
        const size = 0.5 + Math.random() * 1.5;
        const opacity = 0.2 + Math.random() * 0.4;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }

      particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
      });

      powerUps.forEach(p => {
        const colors: Record<string, string> = {
          health: '#ff6b9d',
          speed: '#ffd700',
          weapon: '#00ffff',
          shield: '#00d2ff',
          magnet: '#a855f7'
        };
        const icons: Record<string, string> = {
          health: '+',
          speed: '>',
          weapon: '*',
          shield: 'O',
          magnet: 'M'
        };

        const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Date.now() / 500);

        ctx.beginPath();
        ctx.arc(0, 0, (p.size / 2) * pulse, 0, Math.PI * 2);
        ctx.fillStyle = colors[p.type] + '44';
        ctx.fill();
        ctx.strokeStyle = colors[p.type];
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = colors[p.type];
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icons[p.type], p.x, p.y);
      });

      enemyBullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size / 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });

      playerBullets.forEach(b => {
        ctx.save();
        ctx.translate(b.x, b.y);

        const angle = Math.atan2(b.vy, b.vx);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.ellipse(0, 0, b.size, b.size / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(b.size / 2, 0, b.size / 3, b.size / 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.restore();
      });

      enemies.forEach(e => {
        const colors: Record<string, string> = {
          basic: '#ff6b6b',
          shooter: '#ffd700',
          spinner: '#9b59b6',
          burst: '#e74c3c'
        };

        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);

        ctx.beginPath();
        ctx.arc(0, 0, e.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = colors[e.type];
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-e.size / 6, -e.size / 8, e.size / 8, 0, Math.PI * 2);
        ctx.arc(e.size / 6, -e.size / 8, e.size / 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        if (e.health < e.maxHealth) {
          const healthPercent = e.health / e.maxHealth;
          ctx.fillStyle = '#333';
          ctx.fillRect(e.x - e.size / 2, e.y - e.size / 2 - 8, e.size, 4);
          ctx.fillStyle = '#00ff88';
          ctx.fillRect(e.x - e.size / 2, e.y - e.size / 2 - 8, e.size * healthPercent, 4);
        }
      });

      const state = engine.getState();
      const p = state.player;

      const alpha = state.player.invincibleFrames > 0 && Math.floor(state.player.invincibleFrames / 3) % 2 === 0 ? 0.5 : 1;
      ctx.globalAlpha = alpha;

      if (p.hasShield) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.6)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 210, 255, 0.1)';
        ctx.fill();
      }

      if (p.hasMagnet) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.magnetRange, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const shipGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      shipGradient.addColorStop(0, '#00ffff');
      shipGradient.addColorStop(1, '#0066ff');
      ctx.fillStyle = shipGradient;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y - p.size / 2);
      ctx.lineTo(p.x - p.size / 2, p.y + p.size / 2);
      ctx.lineTo(p.x, p.y + p.size / 4);
      ctx.lineTo(p.x + p.size / 2, p.y + p.size / 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [engine, gameState, player, enemies, playerBullets, enemyBullets, powerUps, particles, width, height]);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[600px] px-4">
        <motion.button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{
            backgroundColor: 'rgba(26, 26, 46, 0.8)',
            color: '#ff6b9d',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 10px rgba(255, 107, 157, 0.3)',
            border: '1px solid rgba(255, 107, 157, 0.3)'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>分数</div>
          <div className="text-3xl font-bold" style={{ color: '#ff6b9d' }}>{score}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>等级</div>
          <div className="text-2xl font-bold" style={{ color: '#00ffff' }}>{level}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>时间</div>
          <div className="text-xl font-bold" style={{ color: '#a855f7' }}>{formatTime(survivalTime)}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>最高</div>
          <div className="text-xl font-bold" style={{ color: '#00d2ff' }}>{bestScore}</div>
        </div>
      </div>

      {gameState === 'playing' && (
        <div className="flex items-center gap-4 px-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(0, 255, 255, 0.3)', border: '1px solid rgba(0, 255, 255, 0.5)' }}>
            <span style={{ color: '#00ffff' }}>W</span>
            <span style={{ color: '#00ffff' }}>Lv.{player.weaponLevel}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(0, 210, 255, 0.3)', border: '1px solid rgba(0, 210, 255, 0.5)' }}>
            <span style={{ color: '#00d2ff' }}>O</span>
            <span style={{ color: '#00d2ff' }}>{player.hasShield ? 'ON' : 'OFF'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(168, 85, 247, 0.3)', border: '1px solid rgba(168, 85, 247, 0.5)' }}>
            <span style={{ color: '#a855f7' }}>M</span>
            <span style={{ color: '#a855f7' }}>{player.hasMagnet ? 'ON' : 'OFF'}</span>
          </div>
        </div>
      )}

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          boxShadow: '0 0 40px rgba(255, 107, 157, 0.3)',
          border: '2px solid rgba(255, 107, 157, 0.4)'
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
              style={{ backgroundColor: 'rgba(15, 15, 26, 0.95)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-7xl mb-6"
                animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🌟
              </motion.div>
              <div className="text-4xl font-bold mb-3" style={{ color: '#ffffff' }}>
                弹幕天堂
              </div>
              <div className="text-lg mb-2" style={{ color: '#ffd700' }}>
                躲避华丽弹幕，生存到最后
              </div>
              <div className="text-sm mb-8 opacity-70" style={{ color: '#aaa' }}>
                收集道具升级武器 | Shift加速移动
              </div>
              <motion.button
                onClick={handleStart}
                className="px-10 py-4 rounded-xl text-xl font-bold mb-4"
                style={{
                  background: 'linear-gradient(135deg, #ff6b9d 0%, #a855f7 100%)',
                  color: '#ffffff',
                  boxShadow: '0 0 30px rgba(255, 107, 157, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开始游戏
              </motion.button>
              <div className="text-sm opacity-60" style={{ color: '#aaaaaa' }}>
                WASD移动 | 自动射击 | 空格/回车开始
              </div>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(15, 15, 26, 0.95)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                💥
              </motion.div>
              <div className="text-5xl font-bold mb-4" style={{ color: '#ff6b9d' }}>
                游戏结束
              </div>
              <div className="text-3xl mb-2" style={{ color: '#ffd700' }}>
                得分: {score}
              </div>
              <div className="text-lg mb-2" style={{ color: '#a855f7' }}>
                存活时间: {formatTime(survivalTime)}
              </div>
              <div className="text-lg mb-2" style={{ color: '#00ffff' }}>
                到达等级: {level}
              </div>
              {score >= bestScore && score > 0 && (
                <motion.div
                  className="text-xl mb-4"
                  style={{ color: '#4ecdc4' }}
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
                  background: 'linear-gradient(135deg, #00ffff 0%, #a855f7 100%)',
                  color: '#ffffff',
                  boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)'
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
        <div>WASD移动 | Shift加速 | 自动射击</div>
      </div>

      <div className="flex gap-6 mt-2 text-xs" style={{ color: '#aaaaaa' }}>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ff6b9d' }}>+</span>
          <span>生命</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ffd700' }}>{'>'}</span>
          <span>加速</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#00ffff' }}>*</span>
          <span>武器升级</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#00d2ff' }}>O</span>
          <span>护盾</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#a855f7' }}>M</span>
          <span>磁铁</span>
        </div>
      </div>
    </div>
  );
}
