import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useRAFLoop } from '../../hooks/useGameLoop';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { Subway2Engine, SUBWAY2_CONSTANTS, Obstacle } from './engine';

interface Subway2Record {
  bestScore: number;
  totalGames: number;
  lastPlayed: string;
}

export default function Subway2() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Subway2Engine | null>(null);
  const [, setHighScore] = useLocalStorage<Subway2Record>(STORAGE_KEYS.SUBWAY2, {
    bestScore: 0,
    totalGames: 0,
    lastPlayed: ''
  });

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [coins, setCoins] = useState(0);
  const [keys, setKeys] = useState(0);
  const [lives, setLives] = useState(3);
  const [speed, setSpeed] = useState(SUBWAY2_CONSTANTS.INITIAL_SPEED);
  const [highScoreData, setHighScoreData] = useState<Subway2Record>({ bestScore: 0, totalGames: 0, lastPlayed: '' });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SUBWAY2);
      if (stored) {
        setHighScoreData(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const updateHighScore = useCallback((newScore: number) => {
    setHighScoreData(prev => {
      const updated = {
        bestScore: Math.max(prev.bestScore, newScore),
        totalGames: prev.totalGames + 1,
        lastPlayed: new Date().toISOString()
      };
      setHighScore(updated);
      return updated;
    });
  }, [setHighScore]);

  const startGame = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new Subway2Engine();
    } else {
      engineRef.current.reset();
    }
    setGameState('playing');
  }, []);

  const endGame = useCallback(() => {
    setGameState('gameover');
    updateHighScore(score);
  }, [score, updateHighScore]);

  const handleTick = useCallback(() => {
    if (!engineRef.current) return;

    engineRef.current.tick();
    const state = engineRef.current.getState();

    setScore(state.score);
    setDistance(state.distance);
    setCoins(state.coins);
    setKeys(state.keys);
    setLives(state.lives);
    setSpeed(state.speed);

    if (state.isGameOver) {
      endGame();
    }
  }, [endGame]);

  useRAFLoop(handleTick, gameState === 'playing');

  useKeyboard({
    onArrowLeft: () => engineRef.current?.moveLeft(),
    onArrowRight: () => engineRef.current?.moveRight(),
    onArrowUp: () => engineRef.current?.jump(),
    onArrowDown: () => engineRef.current?.slide(),
    onW: () => engineRef.current?.jump(),
    onA: () => engineRef.current?.moveLeft(),
    onS: () => engineRef.current?.slide(),
    onD: () => engineRef.current?.moveRight(),
    onSpace: () => engineRef.current?.jump(),
    enabled: gameState === 'playing'
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { CANVAS_WIDTH, CANVAS_HEIGHT, LANE_WIDTH, LANE_COUNT, PLAYER_WIDTH, PLAYER_HEIGHT } = SUBWAY2_CONSTANTS;

    const drawLaneLines = () => {
      for (let i = 1; i < LANE_COUNT; i++) {
        ctx.strokeStyle = `${NEON_COLORS.neonBlue}30`;
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 15]);
        ctx.beginPath();
        ctx.moveTo(i * LANE_WIDTH, 0);
        ctx.lineTo(i * LANE_WIDTH, CANVAS_HEIGHT);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    };

    const drawGround = () => {
      const gradient = ctx.createLinearGradient(0, CANVAS_HEIGHT - 100, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, '#2c3e50');
      gradient.addColorStop(1, '#1a252f');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);

      ctx.strokeStyle = NEON_COLORS.neonPink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT - 100);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 100);
      ctx.stroke();
    };

    const drawObstacle = (obs: Obstacle) => {
      if (obs.collected) return;

      ctx.save();

      switch (obs.type) {
        case 'train':
          const trainGradient = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.height);
          trainGradient.addColorStop(0, '#e74c3c');
          trainGradient.addColorStop(0.5, '#c0392b');
          trainGradient.addColorStop(1, '#922b21');
          ctx.fillStyle = trainGradient;
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.fillStyle = '#f1c40f';
          ctx.fillRect(obs.x + 5, obs.y + 5, 15, 15);
          ctx.fillRect(obs.x + obs.width - 20, obs.y + 5, 15, 15);
          break;

        case 'fence':
          ctx.fillStyle = '#8b4513';
          ctx.fillRect(obs.x, obs.y + obs.height - 15, obs.width, 15);
          for (let i = 0; i < obs.width; i += 15) {
            ctx.fillRect(obs.x + i, obs.y, 8, obs.height);
          }
          break;

        case 'luggage':
          ctx.fillStyle = '#3498db';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.fillStyle = '#2980b9';
          ctx.fillRect(obs.x + obs.width - 10, obs.y - 5, 8, 10);
          break;

        case 'pillar':
          const pillarGradient = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.width, obs.y);
          pillarGradient.addColorStop(0, '#7f8c8d');
          pillarGradient.addColorStop(0.5, '#bdc3c7');
          pillarGradient.addColorStop(1, '#7f8c8d');
          ctx.fillStyle = pillarGradient;
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          break;

        case 'coin':
          ctx.save();
          ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);
          const time = Date.now() / 200;
          const scaleX = Math.abs(Math.cos(time));
          ctx.scale(scaleX || 0.1, 1);
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fillStyle = '#f1c40f';
          ctx.fill();
          ctx.strokeStyle = '#f39c12';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', 0, 0);
          ctx.restore();
          break;

        case 'key':
          ctx.save();
          ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);
          const keyRotation = Math.sin(Date.now() / 300) * 0.2;
          ctx.rotate(keyRotation);
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(0, -5, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(-3, 0, 6, 20);
          ctx.fillRect(-3, 15, 10, 4);
          ctx.fillRect(-3, 10, 8, 4);
          ctx.restore();
          break;

        case 'powerup':
          ctx.save();
          ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);
          const pulse = 1 + Math.sin(Date.now() / 100) * 0.2;
          ctx.scale(pulse, pulse);
          ctx.beginPath();
          ctx.arc(0, 0, 15, 0, Math.PI * 2);
          const powerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
          powerGradient.addColorStop(0, '#fff');
          powerGradient.addColorStop(0.5, NEON_COLORS.neonPurple);
          powerGradient.addColorStop(1, NEON_COLORS.neonPink);
          ctx.fillStyle = powerGradient;
          ctx.fill();
          ctx.shadowColor = NEON_COLORS.neonPink;
          ctx.shadowBlur = 20;
          ctx.restore();
          break;
      }

      ctx.restore();
    };

    const drawPlayer = () => {
      if (!engineRef.current) return;
      const state = engineRef.current.getState();
      const { player, invincible } = state;

      ctx.save();

      if (invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }

      const playerY = player.isSliding ? player.y + PLAYER_HEIGHT - 30 : player.y;
      const playerHeight = player.isSliding ? 30 : PLAYER_HEIGHT;

      const playerGradient = ctx.createLinearGradient(player.x, playerY, player.x + PLAYER_WIDTH, playerY + playerHeight);
      playerGradient.addColorStop(0, NEON_COLORS.neonPink);
      playerGradient.addColorStop(1, NEON_COLORS.neonBlue);

      ctx.fillStyle = playerGradient;
      ctx.shadowColor = NEON_COLORS.neonPink;
      ctx.shadowBlur = 15;

      const x = player.x;
      const y = playerY;
      const w = PLAYER_WIDTH;
      const h = playerHeight;

      if (player.isSliding) {
        ctx.fillRect(x, y, w, h);
      } else if (player.isJumping) {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 8);
        ctx.fill();
      }

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText('🏃', x + w / 2, y + h / 2);

      ctx.restore();
    };

    const render = () => {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      bgGradient.addColorStop(0, '#0f0f1a');
      bgGradient.addColorStop(0.5, '#1a1a2e');
      bgGradient.addColorStop(1, '#16213e');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      drawLaneLines();
      drawGround();

      if (engineRef.current) {
        const state = engineRef.current.getState();
        state.obstacles.forEach(obs => drawObstacle(obs));
        drawPlayer();
      }
    };

    render();
  }, [gameState, distance]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)'
      }}
    >
      <motion.div
        className="glass-card rounded-3xl p-6 w-full max-w-[650px]"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `0 0 40px ${NEON_COLORS.neonPink}20`
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <motion.button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-lg font-bold text-sm"
            style={{
              backgroundColor: NEON_COLORS.darkPurple,
              color: NEON_COLORS.neonBlue,
              boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}40`
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            返回主页
          </motion.button>

          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高分</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>
              {highScoreData.bestScore}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪙</span>
            <span className="text-xl font-bold" style={{ color: '#f1c40f' }}>{coins}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔑</span>
            <span className="text-xl font-bold" style={{ color: NEON_COLORS.gold }}>{keys}</span>
          </div>
          <div className="flex items-center gap-2">
            {Array(3).fill(0).map((_, i) => (
              <span key={i} className="text-xl" style={{ opacity: i < lives ? 1 : 0.3 }}>❤️</span>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mb-4 px-2">
          <div>
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>距离</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>
              {Math.floor(distance)}m
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>得分</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{score}</div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>速度</div>
            <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonCyan }}>
              {speed.toFixed(1)}x
            </div>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <canvas
            ref={canvasRef}
            width={SUBWAY2_CONSTANTS.CANVAS_WIDTH}
            height={SUBWAY2_CONSTANTS.CANVAS_HEIGHT}
            className="rounded-2xl"
            style={{
              boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
              border: `2px solid ${NEON_COLORS.neonPink}40`
            }}
          />
        </div>

        <AnimatePresence mode="wait">
          {gameState === 'idle' && (
            <motion.div
              key="idle"
              className="flex flex-col items-center justify-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                🚇
              </motion.div>
              <h2 className="text-3xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
                地铁跑酷 2
              </h2>
              <p className="text-center mb-6 opacity-70" style={{ color: NEON_COLORS.gold }}>
                躲避障碍，收集金币和钥匙！
              </p>
              <motion.button
                onClick={startGame}
                className="px-8 py-4 rounded-xl font-bold text-xl"
                style={{
                  background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonPurple})`,
                  color: '#fff',
                  boxShadow: `0 0 30px ${NEON_COLORS.neonPink}`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开始游戏
              </motion.button>
            </motion.div>
          )}

          {gameState === 'playing' && (
            <motion.div
              key="playing"
              className="flex justify-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.button
                onClick={() => engineRef.current?.moveLeft()}
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{
                  backgroundColor: NEON_COLORS.darkPurple,
                  color: NEON_COLORS.neonBlue,
                  boxShadow: `0 0 15px ${NEON_COLORS.neonBlue}40`,
                  border: `2px solid ${NEON_COLORS.neonBlue}`
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                ←
              </motion.button>

              <div className="flex flex-col gap-2">
                <motion.button
                  onClick={() => engineRef.current?.jump()}
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{
                    backgroundColor: NEON_COLORS.neonPink,
                    color: '#fff',
                    boxShadow: `0 0 15px ${NEON_COLORS.neonPink}60`
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ↑
                </motion.button>
                <motion.button
                  onClick={() => engineRef.current?.slide()}
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{
                    backgroundColor: NEON_COLORS.neonPink,
                    color: '#fff',
                    boxShadow: `0 0 15px ${NEON_COLORS.neonPink}60`
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ↓
                </motion.button>
              </div>

              <motion.button
                onClick={() => engineRef.current?.moveRight()}
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{
                  backgroundColor: NEON_COLORS.darkPurple,
                  color: NEON_COLORS.neonBlue,
                  boxShadow: `0 0 15px ${NEON_COLORS.neonBlue}40`,
                  border: `2px solid ${NEON_COLORS.neonBlue}`
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                →
              </motion.button>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              key="gameover"
              className="flex flex-col items-center justify-center py-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                💥
              </motion.div>
              <h2 className="text-3xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
                游戏结束
              </h2>
              <div className="text-center mb-6">
                <div className="text-xl mb-2" style={{ color: NEON_COLORS.gold }}>
                  距离: {Math.floor(distance)}m
                </div>
                <div className="text-2xl font-bold mb-2" style={{ color: NEON_COLORS.neonBlue }}>
                  得分: {score}
                </div>
                <div className="flex justify-center gap-4">
                  <span className="text-xl">🪙 {coins}</span>
                  <span className="text-xl">🔑 {keys}</span>
                </div>
              </div>
              <div className="flex gap-4">
                <motion.button
                  onClick={startGame}
                  className="px-6 py-3 rounded-lg font-bold"
                  style={{
                    backgroundColor: NEON_COLORS.neonPink,
                    color: '#fff',
                    boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  再来一局
                </motion.button>
                <motion.button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 rounded-lg font-bold"
                  style={{
                    backgroundColor: NEON_COLORS.darkPurple,
                    color: NEON_COLORS.neonBlue,
                    border: `2px solid ${NEON_COLORS.neonBlue}`
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  返回主页
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center mt-4 opacity-60 text-sm" style={{ color: NEON_COLORS.gold }}>
          <div>← → 换道 | ↑ 跳 | ↓ 滑</div>
          <div>空格键也可以跳跃</div>
        </div>
      </motion.div>
    </div>
  );
}
