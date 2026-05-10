import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BeatRunEngine, Obstacle, PowerUp } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { useGameLoop } from '../../hooks/useGameLoop';

const engine = new BeatRunEngine();

interface FeedbackEffect {
  text: string;
  color: string;
  time: number;
}

export default function BeatRun() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [distance, setDistance] = useState(0);
  const [playerLane, setPlayerLane] = useState(2);
  const [playerY, setPlayerY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEffect | null>(null);
  const [hasShield, setHasShield] = useState(false);
  const [hasMagnet, setHasMagnet] = useState(false);
  const [isSlowMo, setIsSlowMo] = useState(false);
  const [beats, setBeats] = useState<number[]>([]);
  const feedbackTimerRef = useRef<number | null>(null);
  const canvasSize = engine.getCanvasSize();
  const groundY = engine.getGroundY();
  const laneWidth = engine.getLaneWidth();

  const handleGameLoop = useCallback((deltaTime: number) => {
    engine.tick(deltaTime);
    const state = engine.getState();

    setScore(state.score);
    setCombo(state.combo);
    setMaxCombo(state.maxCombo);
    setDistance(Math.floor(state.distance));
    setPlayerLane(state.playerLane);
    setPlayerY(state.playerY);
    setIsJumping(state.isJumping);
    setIsSliding(state.isSliding);
    setObstacles([...state.obstacles]);
    setPowerUps([...state.powerUps]);
    setBeats([...state.beats]);
    setHasShield(state.hasShield);
    setHasMagnet(state.hasMagnet);
    setIsSlowMo(state.isSlowMo);

    if (state.isGameOver && gameState === 'playing') {
      setGameState('gameover');
    }
  }, [gameState]);

  useGameLoop(handleGameLoop, gameState === 'playing');

  const startGame = useCallback(() => {
    engine.start();
    setGameState('playing');
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setDistance(0);
    setPlayerLane(2);
    setPlayerY(0);
    setIsJumping(false);
    setIsSliding(false);
    setObstacles([]);
    setPowerUps([]);
    setFeedback(null);
    setHasShield(false);
    setHasMagnet(false);
    setIsSlowMo(false);
    setBeats([]);
  }, []);

  const handleAction = useCallback((action: 'jump' | 'slide' | 'left' | 'right') => {
    if (gameState !== 'playing') return;

    if (action === 'left') {
      engine.moveLeft();
    } else if (action === 'right') {
      engine.moveRight();
    } else if (action === 'jump') {
      const result = engine.jump();
      if (result.result === 'jump') {
        setFeedback({ text: '跳!', color: NEON_COLORS.neonGreen, time: Date.now() });
      }
    } else if (action === 'slide') {
      const result = engine.slide();
      if (result.result === 'slide') {
        setFeedback({ text: '滑!', color: NEON_COLORS.neonBlue, time: Date.now() });
      }
    }

    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
    }, 300);
  }, [gameState]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState !== 'playing') return;

    switch (e.key.toLowerCase()) {
      case 'a':
      case 'arrowleft':
        handleAction('left');
        break;
      case 'd':
      case 'arrowright':
        handleAction('right');
        break;
      case 'w':
      case 'arrowup':
      case ' ':
        handleAction('jump');
        break;
      case 's':
      case 'arrowdown':
        handleAction('slide');
        break;
    }
  }, [gameState, handleAction]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const renderMenu = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="text-8xl mb-6"
      >
        🏃
      </motion.div>
      <h1 className="text-5xl font-bold mb-2" style={{
        color: NEON_COLORS.neonGreen,
        textShadow: `0 0 30px ${NEON_COLORS.neonGreen}, 0 0 60px ${NEON_COLORS.neonGreen}`
      }}>
        BeatRun
      </h1>
      <h2 className="text-2xl mb-4" style={{ color: NEON_COLORS.neonCyan }}>
        节拍跑酷
      </h2>
      <p className="text-lg mb-8 opacity-80">跟音乐节奏奔跑，躲避障碍!</p>

      <div className="mb-8">
        <div className="text-sm opacity-70 mb-4 text-center">操作说明</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-lg px-4 py-3 text-center">
            <div className="text-2xl mb-1">⬅️ ➡️</div>
            <div className="text-sm font-bold">A / D</div>
            <div className="text-xs opacity-70">左右移动</div>
          </div>
          <div className="glass-card rounded-lg px-4 py-3 text-center">
            <div className="text-2xl mb-1">⬆️</div>
            <div className="text-sm font-bold">W / 空格</div>
            <div className="text-xs opacity-70">跳跃</div>
          </div>
          <div className="glass-card rounded-lg px-4 py-3 text-center col-span-2">
            <div className="text-2xl mb-1">⬇️</div>
            <div className="text-sm font-bold">S</div>
            <div className="text-xs opacity-70">滑铲</div>
          </div>
        </div>
      </div>

      <motion.button
        onClick={startGame}
        className="px-12 py-4 rounded-xl text-xl font-bold mb-4"
        style={{
          background: `linear-gradient(135deg, ${NEON_COLORS.neonGreen}, ${NEON_COLORS.neonCyan})`,
          boxShadow: `0 0 30px ${NEON_COLORS.neonGreen}80`,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        开始跑酷
      </motion.button>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-2 rounded-lg text-base"
        style={{
          background: 'transparent',
          border: `2px solid ${NEON_COLORS.textDim}`,
          color: NEON_COLORS.textDim,
        }}
      >
        返回主页
      </button>
    </motion.div>
  );

  const renderObstacle = (obstacle: Obstacle) => {
    const colors: Record<string, string> = {
      jump: NEON_COLORS.danger,
      slide: NEON_COLORS.warning,
      double: NEON_COLORS.neonPurple,
    };

    const icons: Record<string, string> = {
      jump: '🚧',
      slide: '🔽',
      double: '⚡',
    };

    return (
      <motion.div
        key={obstacle.id}
        className="absolute flex items-center justify-center"
        style={{
          left: obstacle.lane * laneWidth,
          top: obstacle.y,
          width: laneWidth,
          height: 50,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="text-4xl"
          style={{
            filter: `drop-shadow(0 0 10px ${colors[obstacle.type]})`,
          }}
        >
          {icons[obstacle.type]}
        </div>
      </motion.div>
    );
  };

  const renderPowerUp = (powerUp: PowerUp) => {
    const colors: Record<string, string> = {
      shield: NEON_COLORS.neonBlue,
      magnet: NEON_COLORS.gold,
      slowmo: NEON_COLORS.neonPurple,
    };

    const icons: Record<string, string> = {
      shield: '🛡️',
      magnet: '🧲',
      slowmo: '⏱️',
    };

    return (
      <motion.div
        key={powerUp.id}
        className="absolute flex items-center justify-center"
        style={{
          left: powerUp.x - 20,
          top: powerUp.y,
          width: 40,
          height: 40,
        }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <div
          className="text-3xl"
          style={{
            filter: `drop-shadow(0 0 15px ${colors[powerUp.type]})`,
          }}
        >
          {icons[powerUp.type]}
        </div>
      </motion.div>
    );
  };

  const renderGame = () => {
    const playerX = playerLane * laneWidth + laneWidth / 2;

    return (
      <div className="relative" style={{ width: canvasSize.width, height: canvasSize.height }}>
        <div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{
            background: `linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)`,
            boxShadow: `0 0 40px ${NEON_COLORS.neonGreen}40`,
          }}
        >
          <div
            className="absolute left-0 right-0 h-1"
            style={{
              top: groundY + 50,
              background: `linear-gradient(90deg, transparent, ${NEON_COLORS.neonGreen}80, transparent)`,
            }}
          />

          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0"
              style={{
                left: i * laneWidth,
                width: laneWidth,
                background: i % 2 === 0 ? 'rgba(0, 255, 136, 0.02)' : 'transparent',
                borderLeft: `1px dashed rgba(0, 255, 136, 0.1)`,
              }}
            />
          ))}

          {obstacles.map(renderObstacle)}
          {powerUps.map(renderPowerUp)}

          <motion.div
            className="absolute"
            style={{
              left: playerX - 20,
              bottom: groundY + 50 - playerY,
              width: 40,
              height: isSliding ? 20 : 50,
            }}
            animate={{
              y: isJumping ? [0, -10, 0] : 0,
            }}
            transition={{
              duration: 0.3,
              repeat: isJumping ? 1 : 0,
            }}
          >
            {hasShield && (
              <div
                className="absolute -inset-2 rounded-full opacity-50"
                style={{
                  background: `radial-gradient(circle, ${NEON_COLORS.neonBlue}40, transparent)`,
                  border: `2px solid ${NEON_COLORS.neonBlue}`,
                }}
              />
            )}
            <div className="text-4xl">
              {isSliding ? '🛷' : '🏃'}
            </div>
          </motion.div>

          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <div className="glass-card rounded-lg px-3 py-2">
              <div className="text-xs opacity-70">距离</div>
              <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonGreen }}>
                {distance}m
              </div>
            </div>
            <div className="glass-card rounded-lg px-3 py-2">
              <div className="text-xs opacity-70">分数</div>
              <div className="text-xl font-bold" style={{ color: NEON_COLORS.primary }}>{score}</div>
            </div>
            <div className="glass-card rounded-lg px-3 py-2">
              <div className="text-xs opacity-70">连击</div>
              <div className="text-xl font-bold" style={{ color: combo > 10 ? NEON_COLORS.gold : NEON_COLORS.text }}>
                {combo}x
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-4">
            <motion.button
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{
                background: `${NEON_COLORS.neonPurple}40`,
                border: `2px solid ${NEON_COLORS.neonPurple}`,
                color: NEON_COLORS.neonPurple,
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleAction('left')}
            >
              ⬅️
            </motion.button>

            <div className="flex flex-col gap-2">
              <motion.button
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{
                  background: `${NEON_COLORS.neonGreen}40`,
                  border: `2px solid ${NEON_COLORS.neonGreen}`,
                  color: NEON_COLORS.neonGreen,
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleAction('jump')}
              >
                ⬆️
              </motion.button>
              <motion.button
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{
                  background: `${NEON_COLORS.neonBlue}40`,
                  border: `2px solid ${NEON_COLORS.neonBlue}`,
                  color: NEON_COLORS.neonBlue,
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleAction('slide')}
              >
                ⬇️
              </motion.button>
            </div>

            <motion.button
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{
                background: `${NEON_COLORS.neonPink}40`,
                border: `2px solid ${NEON_COLORS.neonPink}`,
                color: NEON_COLORS.neonPink,
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleAction('right')}
            >
              ➡️
            </motion.button>
          </div>

          <div className="absolute bottom-24 left-4 right-4 flex justify-center gap-2">
            {hasShield && <span className="text-2xl">🛡️</span>}
            {hasMagnet && <span className="text-2xl">🧲</span>}
            {isSlowMo && <span className="text-2xl">⏱️</span>}
          </div>

          <AnimatePresence>
            {feedback && (
              <motion.div
                className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 text-3xl font-bold pointer-events-none"
                style={{
                  color: feedback.color,
                  textShadow: `0 0 20px ${feedback.color}`,
                }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {feedback.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const renderGameOver = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <div className="text-6xl mb-4">🏁</div>
      <h1 className="text-4xl font-bold mb-6" style={{ color: NEON_COLORS.danger }}>
        游戏结束
      </h1>

      <div className="glass-card rounded-xl p-6 mb-6" style={{ minWidth: 300 }}>
        <div className="text-3xl font-bold mb-4 text-center" style={{ color: NEON_COLORS.neonGreen }}>
          最终得分: {score}
        </div>
        <div className="flex justify-between mb-2">
          <span>奔跑距离:</span>
          <span style={{ color: NEON_COLORS.primary }}>{distance}m</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>最大连击:</span>
          <span style={{ color: NEON_COLORS.gold }}>{maxCombo}x</span>
        </div>
        <div className="flex justify-between">
          <span>准确率:</span>
          <span style={{ color: NEON_COLORS.success }}>{Math.round(score / Math.max(1, distance) * 100)}%</span>
        </div>
      </div>

      <motion.button
        onClick={startGame}
        className="px-10 py-3 rounded-xl text-lg font-bold mb-3"
        style={{
          background: `linear-gradient(135deg, ${NEON_COLORS.neonGreen}, ${NEON_COLORS.neonCyan})`,
          boxShadow: `0 0 30px ${NEON_COLORS.neonGreen}50`,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        再来一局
      </motion.button>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-2 rounded-lg"
        style={{
          background: 'transparent',
          border: `2px solid ${NEON_COLORS.textDim}`,
          color: NEON_COLORS.textDim,
        }}
      >
        返回主页
      </button>
    </motion.div>
  );

  return (
    <div className="flex flex-col items-center p-4 min-h-screen" style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #0a1a0a 100%)` }}>
      <style>{`
        .glass-card {
          background: ${NEON_COLORS.surface}cc;
          backdrop-filter: blur(10px);
          border: 1px solid ${NEON_COLORS.neonGreen}30;
        }
      `}</style>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'gameover' && renderGameOver()}
    </div>
  );
}
