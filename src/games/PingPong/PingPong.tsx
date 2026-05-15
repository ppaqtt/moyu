import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';

interface Vector2 {
  x: number;
  y: number;
}

interface Ball {
  position: Vector2;
  velocity: Vector2;
  radius: number;
}

interface Paddle {
  y: number;
  height: number;
  width: number;
}

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 400;
const BALL_RADIUS = 10;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const BALL_SPEED = 7;
const PADDLE_SPEED = 8;

export default function PingPong() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bestScore, setBestScore] = useLocalStorage<number>('pingpong_highscore', 0);

  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [playerScore, setPlayerScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const ballRef = useRef<Ball>({
    position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
    velocity: { x: BALL_SPEED, y: BALL_SPEED },
    radius: BALL_RADIUS,
  });

  const playerPaddleRef = useRef<Paddle>({
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    height: PADDLE_HEIGHT,
    width: PADDLE_WIDTH,
  });

  const cpuPaddleRef = useRef<Paddle>({
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    height: PADDLE_HEIGHT,
    width: PADDLE_WIDTH,
  });

  const keysPressed = useRef<Set<string>>(new Set());
  const animationRef = useRef<number>(0);
  const gameLoopRef = useRef<(() => void) | null>(null);

  const resetBall = useCallback((direction: number = 1) => {
    ballRef.current = {
      position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
      velocity: {
        x: BALL_SPEED * direction * (Math.random() > 0.5 ? 1 : -1),
        y: BALL_SPEED * (Math.random() - 0.5) * 2,
      },
      radius: BALL_RADIUS,
    };
  }, []);

  const getCpuSpeed = useCallback(() => {
    switch (difficulty) {
      case 'easy': return PADDLE_SPEED * 0.5;
      case 'medium': return PADDLE_SPEED * 0.75;
      case 'hard': return PADDLE_SPEED * 0.95;
    }
  }, [difficulty]);

  const startGame = useCallback(() => {
    setGameState('playing');
    setPlayerScore(0);
    setCpuScore(0);
    resetBall();
    playerPaddleRef.current.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    cpuPaddleRef.current.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
  }, [resetBall]);

  const updateGame = useCallback(() => {
    const ball = ballRef.current;
    const playerPaddle = playerPaddleRef.current;
    const cpuPaddle = cpuPaddleRef.current;

    if (keysPressed.current.has('ArrowUp') || keysPressed.current.has('w') || keysPressed.current.has('W')) {
      playerPaddle.y = Math.max(0, playerPaddle.y - PADDLE_SPEED);
    }
    if (keysPressed.current.has('ArrowDown') || keysPressed.current.has('s') || keysPressed.current.has('S')) {
      playerPaddle.y = Math.min(CANVAS_HEIGHT - playerPaddle.height, playerPaddle.y + PADDLE_SPEED);
    }

    ball.position.x += ball.velocity.x;
    ball.position.y += ball.velocity.y;

    if (ball.position.y - ball.radius < 0) {
      ball.position.y = ball.radius;
      ball.velocity.y = -ball.velocity.y;
    }
    if (ball.position.y + ball.radius > CANVAS_HEIGHT) {
      ball.position.y = CANVAS_HEIGHT - ball.radius;
      ball.velocity.y = -ball.velocity.y;
    }

    if (
      ball.position.x - ball.radius < playerPaddle.width &&
      ball.position.y > playerPaddle.y &&
      ball.position.y < playerPaddle.y + playerPaddle.height &&
      ball.velocity.x < 0
    ) {
      ball.position.x = playerPaddle.width + ball.radius;
      const hitPos = (ball.position.y - playerPaddle.y) / playerPaddle.height;
      const angle = (hitPos - 0.5) * Math.PI / 3;
      const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2) * 1.05;
      ball.velocity.x = Math.cos(angle) * speed;
      ball.velocity.y = Math.sin(angle) * speed;
    }

    if (
      ball.position.x + ball.radius > CANVAS_WIDTH - cpuPaddle.width &&
      ball.position.y > cpuPaddle.y &&
      ball.position.y < cpuPaddle.y + cpuPaddle.height &&
      ball.velocity.x > 0
    ) {
      ball.position.x = CANVAS_WIDTH - cpuPaddle.width - ball.radius;
      const hitPos = (ball.position.y - cpuPaddle.y) / cpuPaddle.height;
      const angle = Math.PI - (hitPos - 0.5) * Math.PI / 3;
      const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2) * 1.05;
      ball.velocity.x = Math.cos(angle) * speed;
      ball.velocity.y = Math.sin(angle) * speed;
    }

    const cpuSpeed = getCpuSpeed();
    const cpuCenter = cpuPaddle.y + cpuPaddle.height / 2;
    if (ball.position.x > CANVAS_WIDTH / 2) {
      if (cpuCenter < ball.position.y - 10) {
        cpuPaddle.y = Math.min(CANVAS_HEIGHT - cpuPaddle.height, cpuPaddle.y + cpuSpeed);
      } else if (cpuCenter > ball.position.y + 10) {
        cpuPaddle.y = Math.max(0, cpuPaddle.y - cpuSpeed);
      }
    }

    if (ball.position.x < 0) {
      setCpuScore(prev => {
        const newScore = prev + 1;
        if (newScore >= 11) {
          setGameState('gameover');
        }
        return newScore;
      });
      resetBall(1);
    }
    if (ball.position.x > CANVAS_WIDTH) {
      setPlayerScore(prev => {
        const newScore = prev + 1;
        if (newScore > bestScore) {
          setBestScore(newScore);
        }
        if (newScore >= 11) {
          setGameState('gameover');
        }
        return newScore;
      });
      resetBall(-1);
    }
  }, [resetBall, getCpuSpeed, bestScore, setBestScore]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = NEON_COLORS.neonCyan;
    ctx.fillRect(0, playerPaddleRef.current.y, playerPaddleRef.current.width, playerPaddleRef.current.height);

    ctx.fillStyle = NEON_COLORS.neonPink;
    ctx.fillRect(CANVAS_WIDTH - cpuPaddleRef.current.width, cpuPaddleRef.current.y, cpuPaddleRef.current.width, cpuPaddleRef.current.height);

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ballRef.current.position.x, ballRef.current.position.y, ballRef.current.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(playerScore.toString(), CANVAS_WIDTH / 4, 60);
    ctx.fillText(cpuScore.toString(), (CANVAS_WIDTH * 3) / 4, 60);
    ctx.textAlign = 'left';
  }, [playerScore, cpuScore]);

  const gameLoop = useCallback(() => {
    if (gameState === 'playing') {
      updateGame();
      render();
    }
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, updateGame, render]);

  useEffect(() => {
    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = NEON_COLORS.neonCyan;
    ctx.fillRect(0, CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, PADDLE_WIDTH, PADDLE_HEIGHT);

    ctx.fillStyle = NEON_COLORS.neonPink;
    ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, PADDLE_WIDTH, PADDLE_HEIGHT);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('0', CANVAS_WIDTH / 4, 60);
    ctx.fillText('0', (CANVAS_WIDTH * 3) / 4, 60);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background}, #0f0f1f)` }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl font-bold mb-2" style={{ color: NEON_COLORS.neonCyan }}>🏓 乒乓球</h1>
        <p className="text-gray-400">使用 W/S 或 ↑/↓ 键移动球拍，先得11分获胜</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-6 flex gap-4"
      >
        {(['easy', 'medium', 'hard'] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${difficulty === d ? 'ring-2' : 'opacity-60 hover:opacity-100'}`}
            style={{
              background: difficulty === d ? NEON_COLORS.neonPurple : NEON_COLORS.surface,
              color: '#fff',
              ringColor: NEON_COLORS.neonCyan,
            }}
          >
            {d === 'easy' ? '简单' : d === 'medium' ? '中等' : '困难'}
          </button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl overflow-hidden"
        style={{
          boxShadow: `0 0 40px ${NEON_COLORS.neonCyan}40`,
          border: `2px solid ${NEON_COLORS.neonCyan}40`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 flex gap-4"
      >
        {gameState === 'menu' && (
          <motion.button
            onClick={startGame}
            className="px-8 py-4 rounded-xl font-bold text-lg"
            style={{
              background: `linear-gradient(135deg, ${NEON_COLORS.neonCyan}, ${NEON_COLORS.neonPurple})`,
              color: '#fff',
              boxShadow: `0 0 30px ${NEON_COLORS.neonCyan}50`,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            开始游戏
          </motion.button>
        )}

        {gameState === 'playing' && (
          <motion.button
            onClick={() => setGameState('menu')}
            className="px-8 py-4 rounded-xl font-bold text-lg"
            style={{
              background: NEON_COLORS.surface,
              color: '#fff',
              border: `2px solid ${NEON_COLORS.neonPink}`,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            退出
          </motion.button>
        )}

        {gameState === 'gameover' && (
          <motion.button
            onClick={startGame}
            className="px-8 py-4 rounded-xl font-bold text-lg"
            style={{
              background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonPurple})`,
              color: '#fff',
              boxShadow: `0 0 30px ${NEON_COLORS.neonPink}50`,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            再来一局
          </motion.button>
        )}
      </motion.div>

      <motion.button
        onClick={() => navigate('/')}
        className="mt-6 px-6 py-2 rounded-lg"
        style={{
          background: 'transparent',
          color: NEON_COLORS.textDim,
          border: `1px solid ${NEON_COLORS.textDim}`,
        }}
        whileHover={{ scale: 1.05 }}
      >
        返回首页
      </motion.button>

      <div className="mt-4 text-center" style={{ color: NEON_COLORS.textDim }}>
        <p>最高分: {bestScore}</p>
      </div>
    </div>
  );
}
