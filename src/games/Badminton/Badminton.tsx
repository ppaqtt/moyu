import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';

interface Vector2 {
  x: number;
  y: number;
}

interface Birdie {
  position: Vector2;
  velocity: Vector2;
  radius: number;
}

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const BIRDIE_RADIUS = 8;
const GRAVITY = 0.3;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 80;

export default function Badminton() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bestScore, setBestScore] = useLocalStorage<number>('badminton_highscore', 0);

  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [playerScore, setPlayerScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);

  const birdieRef = useRef<Birdie>({
    position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
    velocity: { x: 0, y: 0 },
    radius: BIRDIE_RADIUS,
  });

  const playerRef = useRef<Player>({
    x: 100,
    y: CANVAS_HEIGHT / 2,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  });

  const cpuPlayerRef = useRef<Player>({
    x: CANVAS_WIDTH - 160,
    y: CANVAS_HEIGHT / 2,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  });

  const keysPressed = useRef<Set<string>>(new Set());
  const animationRef = useRef<number>(0);
  const lastHitRef = useRef<'player' | 'cpu' | null>(null);

  const resetBirdie = useCallback((fromPlayer: boolean = true) => {
    birdieRef.current = {
      position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 3 },
      velocity: { x: fromPlayer ? 5 : -5, y: -8 },
      radius: BIRDIE_RADIUS,
    };
    lastHitRef.current = null;
  }, []);

  const startGame = useCallback(() => {
    setGameState('playing');
    setPlayerScore(0);
    setCpuScore(0);
    resetBirdie();
    playerRef.current.y = CANVAS_HEIGHT / 2;
    cpuPlayerRef.current.y = CANVAS_HEIGHT / 2;
  }, [resetBirdie]);

  const hitBirdie = useCallback((isPlayer: boolean) => {
    const birdie = birdieRef.current;
    const player = isPlayer ? playerRef.current : cpuPlayerRef.current;
    const targetY = isPlayer ? CANVAS_HEIGHT / 4 : CANVAS_HEIGHT * 3 / 4;
    const direction = isPlayer ? 1 : -1;

    birdie.velocity = {
      x: direction * (8 + Math.random() * 4),
      y: (targetY - birdie.position.y) * 0.05,
    };

    lastHitRef.current = isPlayer ? 'player' : 'cpu';
  }, []);

  const updateGame = useCallback(() => {
    const birdie = birdieRef.current;
    const player = playerRef.current;
    const cpu = cpuPlayerRef.current;

    if (keysPressed.current.has('ArrowUp') || keysPressed.current.has('w') || keysPressed.current.has('W')) {
      player.y = Math.max(0, player.y - 6);
    }
    if (keysPressed.current.has('ArrowDown') || keysPressed.current.has('s') || keysPressed.current.has('S')) {
      player.y = Math.min(CANVAS_HEIGHT - player.height, player.y + 6);
    }

    birdie.velocity.y += GRAVITY;
    birdie.position.x += birdie.velocity.x;
    birdie.position.y += birdie.velocity.y;

    if (birdie.position.y > CANVAS_HEIGHT - birdie.radius) {
      birdie.position.y = CANVAS_HEIGHT - birdie.radius;
      birdie.velocity.y = -birdie.velocity.y * 0.6;
    }

    if (birdie.position.y < birdie.radius) {
      birdie.position.y = birdie.radius;
      birdie.velocity.y = -birdie.velocity.y * 0.6;
    }

    const playerHitbox = {
      x: player.x + player.width / 2,
      y: player.y + player.height / 2,
      radius: 40,
    };
    const distToPlayer = Math.sqrt(
      (birdie.position.x - playerHitbox.x) ** 2 +
      (birdie.position.y - playerHitbox.y) ** 2
    );

    if (distToPlayer < playerHitbox.radius + birdie.radius && lastHitRef.current !== 'player') {
      hitBirdie(true);
    }

    const cpuHitbox = {
      x: cpu.x + cpu.width / 2,
      y: cpu.y + cpu.height / 2,
      radius: 40,
    };
    const distToCpu = Math.sqrt(
      (birdie.position.x - cpuHitbox.x) ** 2 +
      (birdie.position.y - cpuHitbox.y) ** 2
    );

    if (distToCpu < cpuHitbox.radius + birdie.radius && lastHitRef.current !== 'cpu') {
      hitBirdie(false);
    }

    if (birdie.position.x > CANVAS_WIDTH) {
      setPlayerScore(prev => {
        const newScore = prev + 1;
        if (newScore > bestScore) {
          setBestScore(newScore);
        }
        return newScore;
      });
      resetBirdie(false);
    }

    if (birdie.position.x < 0) {
      setCpuScore(prev => {
        const newScore = prev + 1;
        if (newScore >= 21) {
          setGameState('gameover');
        }
        return newScore;
      });
      resetBirdie(true);
    }

    if (cpu.y + cpu.height / 2 < birdie.position.y) {
      cpu.y = Math.min(CANVAS_HEIGHT - cpu.height, cpu.y + 4);
    } else if (cpu.y + cpu.height / 2 > birdie.position.y) {
      cpu.y = Math.max(0, cpu.y - 4);
    }
  }, [hitBirdie, resetBirdie, bestScore, setBestScore]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#228b22';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT - 50);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 50);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT / 2);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2);
    ctx.stroke();

    const player = playerRef.current;
    ctx.fillStyle = NEON_COLORS.neonCyan;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + 15, 15, 0, Math.PI * 2);
    ctx.fill();

    const cpu = cpuPlayerRef.current;
    ctx.fillStyle = NEON_COLORS.neonPink;
    ctx.fillRect(cpu.x, cpu.y, cpu.width, cpu.height);
    ctx.beginPath();
    ctx.arc(cpu.x + cpu.width / 2, cpu.y + 15, 15, 0, Math.PI * 2);
    ctx.fill();

    const birdie = birdieRef.current;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(birdie.position.x, birdie.position.y, birdie.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(birdie.position.x, birdie.position.y - birdie.radius);
    ctx.lineTo(birdie.position.x, birdie.position.y + birdie.radius);
    ctx.stroke();

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

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background}, #0f0f1f)` }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl font-bold mb-2" style={{ color: NEON_COLORS.neonGreen }}>🏸 羽毛球</h1>
        <p className="text-gray-400">使用 W/S 或 ↑/↓ 键移动球拍，接到羽毛球后挥拍</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl overflow-hidden"
        style={{
          boxShadow: `0 0 40px ${NEON_COLORS.neonGreen}40`,
          border: `2px solid ${NEON_COLORS.neonGreen}40`,
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
              background: `linear-gradient(135deg, ${NEON_COLORS.neonGreen}, ${NEON_COLORS.neonCyan})`,
              color: '#fff',
              boxShadow: `0 0 30px ${NEON_COLORS.neonGreen}50`,
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
