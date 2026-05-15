import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 500;
const GROUND_Y = 400;
const FIGHT_WIDTH = 80;
const FIGHT_HEIGHT = 120;

interface Fighter {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  isAttacking: boolean;
  attackCooldown: number;
  velocityY: number;
  isJumping: boolean;
}

export default function Boxing() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bestScore, setBestScore] = useLocalStorage<number>('boxing_highscore', 0);

  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [playerWins, setPlayerWins] = useState(0);
  const [cpuWins, setCpuWins] = useState(0);
  const [round, setRound] = useState(1);

  const playerRef = useRef<Fighter>({
    x: 80,
    y: GROUND_Y - FIGHT_HEIGHT,
    width: FIGHT_WIDTH,
    height: FIGHT_HEIGHT,
    health: 100,
    maxHealth: 100,
    isAttacking: false,
    attackCooldown: 0,
    velocityY: 0,
    isJumping: false,
  });

  const cpuRef = useRef<Fighter>({
    x: CANVAS_WIDTH - 160,
    y: GROUND_Y - FIGHT_HEIGHT,
    width: FIGHT_WIDTH,
    height: FIGHT_HEIGHT,
    health: 100,
    maxHealth: 100,
    isAttacking: false,
    attackCooldown: 0,
    velocityY: 0,
    isJumping: false,
  });

  const keysPressed = useRef<Set<string>>(new Set());
  const animationRef = useRef<number>(0);

  const resetRound = useCallback(() => {
    playerRef.current = {
      ...playerRef.current,
      x: 80,
      y: GROUND_Y - FIGHT_HEIGHT,
      health: 100,
      isAttacking: false,
      attackCooldown: 0,
      velocityY: 0,
      isJumping: false,
    };
    cpuRef.current = {
      ...cpuRef.current,
      x: CANVAS_WIDTH - 160,
      y: GROUND_Y - FIGHT_HEIGHT,
      health: 100,
      isAttacking: false,
      attackCooldown: 0,
      velocityY: 0,
      isJumping: false,
    };
  }, []);

  const startGame = useCallback(() => {
    setGameState('playing');
    setPlayerWins(0);
    setCpuWins(0);
    setRound(1);
    resetRound();
  }, [resetRound]);

  const playerAttack = useCallback(() => {
    const player = playerRef.current;
    const cpu = cpuRef.current;

    if (player.attackCooldown > 0) return;

    player.isAttacking = true;
    player.attackCooldown = 30;

    const distance = Math.abs((player.x + player.width) - cpu.x);
    if (distance < 150) {
      cpu.health = Math.max(0, cpu.health - 15);
      if (cpu.health <= 0) {
        setPlayerWins(prev => {
          const newWins = prev + 1;
          if (newWins >= 3) {
            setBestScore(prev => Math.max(prev, newWins));
            setGameState('gameover');
          } else {
            setRound(r => r + 1);
            resetRound();
          }
          return newWins;
        });
      }
    }

    setTimeout(() => {
      player.isAttacking = false;
    }, 200);
  }, [resetRound, setBestScore]);

  const cpuAttack = useCallback(() => {
    const cpu = cpuRef.current;
    const player = playerRef.current;

    if (cpu.attackCooldown > 0) return;

    cpu.isAttacking = true;
    cpu.attackCooldown = 45;

    const distance = Math.abs((cpu.x) - (player.x + player.width));
    if (distance < 150) {
      player.health = Math.max(0, player.health - 12);
      if (player.health <= 0) {
        setCpuWins(prev => {
          const newWins = prev + 1;
          if (newWins >= 3) {
            setBestScore(prev => Math.max(prev, playerWins));
            setGameState('gameover');
          } else {
            setRound(r => r + 1);
            resetRound();
          }
          return newWins;
        });
      }
    }

    setTimeout(() => {
      cpu.isAttacking = false;
    }, 200);
  }, [resetRound, playerWins, setBestScore]);

  const updateGame = useCallback(() => {
    const player = playerRef.current;
    const cpu = cpuRef.current;

    if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a') || keysPressed.current.has('A')) {
      player.x = Math.max(0, player.x - 5);
    }
    if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d') || keysPressed.current.has('D')) {
      player.x = Math.min(CANVAS_WIDTH / 2 - player.width - 10, player.x + 5);
    }
    if ((keysPressed.current.has('ArrowUp') || keysPressed.current.has('w') || keysPressed.current.has('W')) && !player.isJumping) {
      player.velocityY = -15;
      player.isJumping = true;
    }
    if (keysPressed.current.has(' ') && !player.isAttacking) {
      playerAttack();
    }

    player.velocityY += 0.8;
    player.y += player.velocityY;
    if (player.y >= GROUND_Y - player.height) {
      player.y = GROUND_Y - player.height;
      player.velocityY = 0;
      player.isJumping = false;
    }

    if (player.attackCooldown > 0) {
      player.attackCooldown--;
    }

    if (cpu.x > CANVAS_WIDTH / 2 + 20) {
      cpu.x -= 2;
    } else if (cpu.x < CANVAS_WIDTH / 2 + 10) {
      cpu.x += 2;
    }

    if (cpu.attackCooldown > 0) {
      cpu.attackCooldown--;
    }

    if (cpu.attackCooldown === 0 && Math.random() < 0.02) {
      cpuAttack();
    }

    cpu.velocityY += 0.8;
    cpu.y += cpu.velocityY;
    if (cpu.y >= GROUND_Y - cpu.height) {
      cpu.y = GROUND_Y - cpu.height;
      cpu.velocityY = 0;
      cpu.isJumping = false;
    }

    if (Math.random() < 0.01 && !cpu.isJumping) {
      cpu.velocityY = -12;
      cpu.isJumping = true;
    }
  }, [playerAttack, cpuAttack]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#2a2a4e';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, GROUND_Y);
      ctx.lineTo(i + 25, CANVAS_HEIGHT);
      ctx.stroke();
    }

    const drawHealthBar = (x: number, y: number, health: number, maxHealth: number, color: string) => {
      ctx.fillStyle = '#333';
      ctx.fillRect(x, y, 180, 20);
      const healthWidth = (health / maxHealth) * 180;
      const gradient = ctx.createLinearGradient(x, y, x + healthWidth, y);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + '80');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, healthWidth, 20);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 180, 20);
    };

    drawHealthBar(20, 20, playerRef.current.health, playerRef.current.maxHealth, NEON_COLORS.neonCyan);
    drawHealthBar(CANVAS_WIDTH - 200, 20, cpuRef.current.health, cpuRef.current.maxHealth, NEON_COLORS.neonPink);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('玩家', 20, 55);
    ctx.fillText('CPU', CANVAS_WIDTH - 200, 55);

    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`回合 ${round}`, CANVAS_WIDTH / 2, 35);
    ctx.fillText(`${playerWins} - ${cpuWins}`, CANVAS_WIDTH / 2, 60);
    ctx.textAlign = 'left';

    ctx.font = '14px Arial';
    ctx.fillStyle = NEON_COLORS.textDim;
    ctx.fillText('A/D移动 | W跳跃 | 空格攻击', 20, CANVAS_HEIGHT - 20);

    const drawFighter = (fighter: Fighter, facingRight: boolean, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(fighter.x, fighter.y, fighter.width, fighter.height);

      ctx.fillStyle = '#fff';
      const headY = fighter.y - 25;
      ctx.beginPath();
      ctx.arc(fighter.x + fighter.width / 2, headY, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      const eyeOffsetX = facingRight ? 5 : -5;
      ctx.beginPath();
      ctx.arc(fighter.x + fighter.width / 2 + eyeOffsetX, headY - 3, 3, 0, Math.PI * 2);
      ctx.fill();

      if (fighter.isAttacking) {
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        const fistX = facingRight ? fighter.x + fighter.width : fighter.x - 40;
        ctx.beginPath();
        ctx.arc(fistX + 20, fighter.y + 30, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 200, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(fistX + 20, fighter.y + 30, 25, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawFighter(playerRef.current, true, NEON_COLORS.neonCyan);
    drawFighter(cpuRef.current, false, NEON_COLORS.neonPink);
  }, [round, playerWins, cpuWins]);

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background}, #1f1f3f)` }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h1 className="text-5xl font-bold mb-2" style={{ color: NEON_COLORS.neonPink }}>🥊 拳击</h1>
        <p className="text-gray-400">A/D移动 | W跳跃 | 空格攻击 - 先赢3局获胜</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl overflow-hidden"
        style={{
          boxShadow: `0 0 40px ${NEON_COLORS.neonPink}40`,
          border: `2px solid ${NEON_COLORS.neonPink}40`,
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
        className="mt-6 flex gap-4"
      >
        {gameState === 'menu' && (
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
            开始游戏
          </motion.button>
        )}

        {gameState === 'gameover' && (
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
        <p>最高回合胜利: {bestScore}</p>
      </div>
    </div>
  );
}
