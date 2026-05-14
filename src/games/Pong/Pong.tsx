import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const W = 600;
const H = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 12;
const PADDLE_SPEED = 8;
const AI_SPEED = 5;

export default function Pong() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);

  const ballRef = useRef({ x: W / 2, y: H / 2, vx: 5, vy: 3 });
  const playerRef = useRef({ x: 30, y: H / 2 - PADDLE_HEIGHT / 2 });
  const aiRef = useRef({ x: W - 30 - PADDLE_WIDTH, y: H / 2 - PADDLE_HEIGHT / 2 });

  const startGame = useCallback(() => {
    ballRef.current = { x: W / 2, y: H / 2, vx: 5 * (Math.random() > 0.5 ? 1 : -1), vy: 3 * (Math.random() > 0.5 ? 1 : -1) };
    playerRef.current = { x: 30, y: H / 2 - PADDLE_HEIGHT / 2 };
    aiRef.current = { x: W - 30 - PADDLE_WIDTH, y: H / 2 - PADDLE_HEIGHT / 2 };
    setScore({ player: 0, ai: 0 });
    setGameOver(false);
    setWinner(null);
    setGameState('playing');
  }, []);

  const resetBall = useCallback((direction: number) => {
    ballRef.current = { x: W / 2, y: H / 2, vx: 5 * direction, vy: 3 * (Math.random() - 0.5) };
  }, []);

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    const ball = ballRef.current;
    const player = playerRef.current;
    const ai = aiRef.current;

    if (keysRef.current.has('ArrowUp') || keysRef.current.has('w') || keysRef.current.has('W')) {
      player.y = Math.max(0, player.y - PADDLE_SPEED);
    }
    if (keysRef.current.has('ArrowDown') || keysRef.current.has('s') || keysRef.current.has('S')) {
      player.y = Math.min(H - PADDLE_HEIGHT, player.y + PADDLE_SPEED);
    }

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.y - BALL_SIZE / 2 <= 0 || ball.y + BALL_SIZE / 2 >= H) {
      ball.vy = -ball.vy;
      ball.y = ball.y - BALL_SIZE / 2 <= 0 ? BALL_SIZE / 2 : H - BALL_SIZE / 2;
    }

    if (ball.x - BALL_SIZE / 2 <= player.x + PADDLE_WIDTH &&
        ball.x + BALL_SIZE / 2 >= player.x &&
        ball.y >= player.y &&
        ball.y <= player.y + PADDLE_HEIGHT) {
      ball.vx = Math.abs(ball.vx) * 1.05;
      const hitPos = (ball.y - player.y) / PADDLE_HEIGHT - 0.5;
      ball.vy = hitPos * 8;
      ball.x = player.x + PADDLE_WIDTH + BALL_SIZE / 2;
    }

    if (ball.x + BALL_SIZE / 2 >= ai.x &&
        ball.x - BALL_SIZE / 2 <= ai.x + PADDLE_WIDTH &&
        ball.y >= ai.y &&
        ball.y <= ai.y + PADDLE_HEIGHT) {
      ball.vx = -Math.abs(ball.vx) * 1.05;
      const hitPos = (ball.y - ai.y) / PADDLE_HEIGHT - 0.5;
      ball.vy = hitPos * 8;
      ball.x = ai.x - BALL_SIZE / 2;
    }

    if (ball.y < ai.y + PADDLE_HEIGHT / 2) {
      ai.y = Math.max(0, ai.y - AI_SPEED);
    } else if (ball.y > ai.y + PADDLE_HEIGHT / 2) {
      ai.y = Math.min(H - PADDLE_HEIGHT, ai.y + AI_SPEED);
    }

    if (ball.x < 0) {
      setScore(s => ({ ...s, ai: s.ai + 1 }));
      if (score.ai >= 9) {
        setGameState('paused');
        setGameOver(true);
        setWinner('ai');
      } else {
        resetBall(1);
      }
    } else if (ball.x > W) {
      setScore(s => ({ ...s, player: s.player + 1 }));
      if (score.player >= 9) {
        setGameState('paused');
        setGameOver(true);
        setWinner('player');
      } else {
        resetBall(-1);
      }
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(score.player.toString(), W / 4, 50);
    ctx.fillText(score.ai.toString(), (W * 3) / 4, 50);

    const playerGradient = ctx.createLinearGradient(player.x, player.y, player.x + PADDLE_WIDTH, player.y);
    playerGradient.addColorStop(0, '#00ff00');
    playerGradient.addColorStop(1, '#00cc00');
    ctx.fillStyle = playerGradient;
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, PADDLE_WIDTH, PADDLE_HEIGHT, 5);
    ctx.fill();
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    const aiGradient = ctx.createLinearGradient(ai.x, ai.y, ai.x + PADDLE_WIDTH, ai.y);
    aiGradient.addColorStop(0, '#ff0066');
    aiGradient.addColorStop(1, '#cc0052');
    ctx.fillStyle = aiGradient;
    ctx.beginPath();
    ctx.roundRect(ai.x, ai.y, PADDLE_WIDTH, PADDLE_HEIGHT, 5);
    ctx.fill();
    ctx.shadowColor = '#ff0066';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    const ballGradient = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 0, ball.x, ball.y, BALL_SIZE);
    ballGradient.addColorStop(0, '#ffffff');
    ballGradient.addColorStop(1, '#cccccc');
    ctx.fillStyle = ballGradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_SIZE, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, score, resetBall]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (['ArrowUp', 'ArrowDown', 'w', 's', 'W', 'S', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);

  useEffect(() => {
    if (gameState === 'idle') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('0', W / 4, 50);

      ctx.fillStyle = '#ff0066';
      ctx.fillText('0', (W * 3) / 4, 50);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px Arial';
      ctx.fillText('🏓', W / 2, H / 2);
    }
  }, [gameState]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" 
         style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%)' }}>
      <motion.h1 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-6"
        style={{ color: '#00FF00' }}
      >
        🏓 乒乓球
      </motion.h1>

      <div className="mb-4 text-center px-4 py-2 rounded-lg"
           style={{ background: 'rgba(0,0,0,0.3)', color: '#fff' }}>
        {gameOver 
          ? `🎉 游戏结束! ${winner === 'player' ? '玩家' : 'AI'}获胜! (${score.player} - ${score.ai})` 
          : gameState === 'idle'
            ? '点击开始按钮开始游戏'
            : `玩家 ${score.player} : ${score.ai} AI`}
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl overflow-hidden shadow-2xl"
        style={{ 
          boxShadow: '0 0 30px rgba(0, 255, 0, 0.3)',
          border: '4px solid #00FF00'
        }}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ 
            display: 'block',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
      </motion.div>

      <div className="flex gap-4 mt-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startGame}
          className="px-8 py-4 rounded-xl font-bold text-xl"
          style={{ 
            background: 'linear-gradient(135deg, #00FF00, #00FFFF)',
            color: '#000'
          }}
        >
          {gameState === 'idle' ? '🎮 开始游戏' : '🔄 重新开始'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="px-8 py-4 rounded-xl font-bold text-xl"
          style={{ 
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            border: '2px solid #00FF00'
          }}
        >
          🏠 返回首页
        </motion.button>
      </div>

      <div className="mt-6 text-center text-sm" style={{ color: '#888', maxWidth: '500px' }}>
        <p>🎮 <strong>操作说明：</strong></p>
        <p>• 使用 <span style={{ color: '#00ff00' }}>W/S</span> 或 <span style={{ color: '#00ff00' }}>↑/↓</span> 方向键控制球拍</p>
        <p>• 先得 <span style={{ color: '#ffd700' }}>9</span> 分获胜</p>
        <p>• 绿色球拍是你的，粉红色是AI的</p>
      </div>
    </div>
  );
}
