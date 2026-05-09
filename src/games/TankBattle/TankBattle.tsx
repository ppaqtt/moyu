import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { TANK_BATTLE_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { TankBattleEngine, Player, Enemy, Bullet, PowerUp, Explosion, Brick } from './engine';
import { useNavigate } from 'react-router-dom';

const BG_GRADIENT = 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)';

export default function TankBattle() {
  const navigate = useNavigate();
  const [engine] = useState(() => new TankBattleEngine());
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [player, setPlayer] = useState<Player>(() => engine.getState().player);
  const [enemies, setEnemies] = useState<Enemy[]>(() => engine.getState().enemies);
  const [playerBullets, setPlayerBullets] = useState<Bullet[]>(() => engine.getState().playerBullets);
  const [powerUps, setPowerUps] = useState<PowerUp[]>(() => engine.getState().powerUps);
  const [explosions, setExplosions] = useState<Explosion[]>(() => engine.getState().explosions);
  const [bricks, setBricks] = useState<Brick[]>(() => engine.getState().bricks);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [enemiesDestroyed, setEnemiesDestroyed] = useState(0);
  const [totalEnemies, setTotalEnemies] = useState(10);
  const [bestScore, setBestScore] = useLocalStorage(STORAGE_KEYS.TANK_BATTLE, 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastShotRef = useRef(0);
  const { width, height } = engine.getCanvasSize();

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setPlayer({ ...state.player });
    setEnemies([...state.enemies]);
    setPlayerBullets([...state.playerBullets]);
    setPowerUps([...state.powerUps]);
    setExplosions([...state.explosions]);
    setBricks([...state.bricks]);
    setScore(state.score);
    setLives(state.lives);
    setEnemiesDestroyed(state.enemiesDestroyed);
    setTotalEnemies(state.totalEnemies);

    if (state.isVictory && gameState === 'playing') {
      setGameState('gameover');
      if (state.score > bestScore) {
        setBestScore(state.score);
      }
    } else if (state.isGameOver && gameState === 'playing') {
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

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#0f0f1a');
      gradient.addColorStop(0.5, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 50; i++) {
        const x = (Date.now() * 0.02 + i * 37) % (width + 100) - 50;
        const y = (i * 29 + Date.now() * 0.03) % height;
        const size = 0.5 + Math.random() * 1.5;
        const opacity = 0.2 + Math.random() * 0.4;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }

      ctx.fillStyle = '#2d5a27';
      ctx.fillRect(0, 60, width, height - 60);

      ctx.strokeStyle = '#3d7a37';
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 100 + i * 60);
        ctx.lineTo(width, 100 + i * 60);
        ctx.stroke();
      }

      bricks.forEach(brick => {
        const brickGradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
        if (brick.health === 2) {
          brickGradient.addColorStop(0, '#8b4513');
          brickGradient.addColorStop(1, '#654321');
        } else {
          brickGradient.addColorStop(0, '#6b3410');
          brickGradient.addColorStop(1, '#4a2a0a');
        }
        ctx.fillStyle = brickGradient;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

        ctx.strokeStyle = '#3d2010';
        ctx.lineWidth = 2;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

        ctx.fillStyle = '#5a3010';
        ctx.fillRect(brick.x + 2, brick.y + 2, brick.width - 4, 3);
      });

      explosions.forEach(exp => {
        const progress = exp.frame / exp.maxFrames;
        const radius = progress * (exp.maxFrames * 1.5);
        const alpha = 1 - progress;

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 50, ${alpha * 0.5})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 100, 50, ${alpha * 0.7})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
        ctx.fill();
      });

      powerUps.forEach(p => {
        const colors = {
          life: '#ff6b9d',
          fastBullet: '#00ff88'
        };
        const icons = {
          life: '❤',
          fastBullet: '⚡'
        };

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

        ctx.font = '16px Arial';
        ctx.fillText(icons[p.type], p.x + 6, p.y + p.height / 2 + 6);
      });

      playerBullets.forEach(b => {
        const bulletGradient = ctx.createLinearGradient(b.x, b.y + b.height, b.x, b.y);
        if (b.isFast) {
          bulletGradient.addColorStop(0, '#00ffff');
          bulletGradient.addColorStop(0.5, '#00ff00');
          bulletGradient.addColorStop(1, '#ffffff');
        } else {
          bulletGradient.addColorStop(0, '#ffff00');
          bulletGradient.addColorStop(0.5, '#ff8800');
          bulletGradient.addColorStop(1, '#ff4400');
        }
        ctx.fillStyle = bulletGradient;
        ctx.fillRect(b.x, b.y, b.width, b.height);

        ctx.beginPath();
        ctx.arc(b.x + b.width / 2, b.y, b.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });

      enemies.forEach(e => {
        const enemyGradient = ctx.createLinearGradient(e.x, e.y, e.x, e.y + e.height);
        enemyGradient.addColorStop(0, '#4a4a4a');
        enemyGradient.addColorStop(0.5, '#2d2d2d');
        enemyGradient.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = enemyGradient;

        ctx.fillRect(e.x + e.width * 0.2, e.y, e.width * 0.6, e.height);

        ctx.fillRect(e.x, e.y + e.height * 0.3, e.width, e.height * 0.4);

        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.arc(e.x + e.width / 2, e.y + e.height / 2, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.fillRect(e.x + 5, e.y + 5, 8, 8);
        ctx.fillRect(e.x + e.width - 13, e.y + 5, 8, 8);
      });

      const state = engine.getState();
      const p = state.player;

      if (gameState === 'playing') {
        const alpha = state.invincibleTime > 0 && Math.floor(state.invincibleTime / 5) % 2 === 0 ? 0.4 : 1;

        ctx.globalAlpha = alpha;

        const tankGradient = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
        tankGradient.addColorStop(0, '#00d2ff');
        tankGradient.addColorStop(0.5, '#3a7bd5');
        tankGradient.addColorStop(1, '#667eea');
        ctx.fillStyle = tankGradient;

        ctx.fillRect(p.x + p.width * 0.2, p.y, p.width * 0.6, p.height);

        ctx.fillRect(p.x, p.y + p.height * 0.3, p.width, p.height * 0.4);

        ctx.fillStyle = '#00d2ff';
        ctx.fillRect(p.x + p.width * 0.35, p.y - 15, p.width * 0.3, 20);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x + p.width / 2, p.y + p.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(p.x + 8, p.y + 8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x + p.width - 8, p.y + 8, 4, 0, Math.PI * 2);
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
  }, [engine, gameState, player, enemies, playerBullets, powerUps, explosions, bricks, width, height]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
        engine.setKey(key, true);
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'playing') {
          const now = Date.now();
          if (now - lastShotRef.current > 50) {
            engine.shoot();
            lastShotRef.current = now;
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        engine.setKey(key, false);
      }
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

  const isVictory = gameState === 'gameover' && score >= (totalEnemies * 100);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[600px] px-4">
        <motion.button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{
            backgroundColor: 'rgba(26, 26, 46, 0.8)',
            color: '#00d2ff',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 10px rgba(0, 210, 255, 0.3)',
            border: '1px solid rgba(0, 210, 255, 0.3)'
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
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>敌人</div>
          <div className="text-2xl font-bold" style={{ color: '#ff4444' }}>
            {enemiesDestroyed}/{totalEnemies}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <motion.span
              key={i}
              className="text-xl"
              animate={{ scale: i < lives ? 1 : 0.7, opacity: i < lives ? 1 : 0.2 }}
            >
              🎖
            </motion.span>
          ))}
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>最高</div>
          <div className="text-xl font-bold" style={{ color: '#00d2ff' }}>{bestScore}</div>
        </div>
      </div>

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
                animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                🎖
              </motion.div>
              <div className="text-4xl font-bold mb-3" style={{ color: '#ffffff' }}>
                坦克大战
              </div>
              <div className="text-lg mb-8" style={{ color: '#ffd700' }}>
                消灭所有敌方坦克
              </div>
              <motion.button
                onClick={handleStart}
                className="px-10 py-4 rounded-xl text-xl font-bold mb-4"
                style={{
                  background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
                  color: '#ffffff',
                  boxShadow: '0 0 30px rgba(255, 107, 157, 0.5)'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开始游戏
              </motion.button>
              <div className="text-sm opacity-60" style={{ color: '#aaaaaa' }}>
                WASD移动 | 空格发射
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
                {isVictory ? '🏆' : '💥'}
              </motion.div>
              <div className="text-5xl font-bold mb-4" style={{ color: isVictory ? '#ffd700' : '#ff6b9d' }}>
                {isVictory ? '胜利!' : '游戏结束'}
              </div>
              <div className="text-3xl mb-2" style={{ color: '#ffd700' }}>
                得分: {score}
              </div>
              <div className="text-lg mb-2" style={{ color: '#00ff88' }}>
                摧毁敌人: {enemiesDestroyed}/{totalEnemies}
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
                  background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
                  color: '#ffffff',
                  boxShadow: '0 0 30px rgba(0, 210, 255, 0.5)'
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
        <div>WASD移动坦克 | 空格键发射</div>
      </div>

      <div className="flex gap-6 mt-2 text-xs" style={{ color: '#aaaaaa' }}>
        <div className="flex items-center gap-1">
          <span style={{ color: '#ff6b9d' }}>❤</span>
          <span>生命恢复</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#00ff88' }}>⚡</span>
          <span>加速炮弹</span>
        </div>
      </div>
    </div>
  );
}
