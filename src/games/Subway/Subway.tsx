import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';

const W = 400, H = 600;
const PLAYER_W = 40, PLAYER_H = 60;
const OBSTACLE_W = 30, OBSTACLE_H = 50;
const COIN_SIZE = 20;
const GROUND_Y = H - 80;
const SPEED_INITIAL = 5;

interface Obstacle { x: number; y: number; type: 'barrier' | 'train'; passed: boolean; }
interface Coin { x: number; y: number; collected: boolean; }

export default function Subway() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef(W/2 - PLAYER_W/2);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const speedRef = useRef(SPEED_INITIAL);
  const gameStateRef = useRef<'idle'|'playing'|'lost'>('idle');
  const frameRef = useRef(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<'idle'|'playing'|'lost'>('idle');

  const resetGame = useCallback(() => {
    playerRef.current = W/2 - PLAYER_W/2;
    obstaclesRef.current = [];
    coinsRef.current = [];
    scoreRef.current = 0;
    livesRef.current = 3;
    speedRef.current = SPEED_INITIAL;
    frameRef.current = 0;
    setScore(0);
    setLives(3);
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    gameStateRef.current = 'playing';
    setGameState('playing');
  }, [resetGame]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameStateRef.current !== 'playing') return;
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        playerRef.current = Math.max(0, playerRef.current - 25);
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        playerRef.current = Math.min(W - PLAYER_W, playerRef.current + 25);
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      playerRef.current = Math.max(0, Math.min(W - PLAYER_W, e.clientX - rect.left - PLAYER_W/2));
    };
    canvas.addEventListener('mousemove', handleMouse);
    return () => canvas.removeEventListener('mousemove', handleMouse);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const anim = setInterval(() => {
      frameRef.current++;
      
      speedRef.current = SPEED_INITIAL + Math.floor(scoreRef.current / 500);
      const speed = speedRef.current;

      if (frameRef.current % Math.max(30, 60 - speed) === 0) {
        const lane = Math.floor(Math.random() * 3);
        const laneX = 60 + lane * 120;
        if (Math.random() > 0.5) {
          obstaclesRef.current.push({
            x: laneX,
            y: -OBSTACLE_H,
            type: Math.random() > 0.7 ? 'train' : 'barrier',
            passed: false
          });
        } else {
          coinsRef.current.push({ x: laneX + 10, y: -COIN_SIZE, collected: false });
        }
      }

      for (const obs of obstaclesRef.current) {
        obs.y += speed;
      }
      for (const coin of coinsRef.current) {
        coin.y += speed;
      }

      const playerX = playerRef.current;
      const playerY = GROUND_Y;

      for (const obs of obstaclesRef.current) {
        if (obs.passed) continue;
        if (playerX < obs.x + OBSTACLE_W &&
            playerX + PLAYER_W > obs.x &&
            playerY < obs.y + OBSTACLE_H &&
            playerY + PLAYER_H > obs.y) {
          livesRef.current--;
          setLives(livesRef.current);
          obs.passed = true;
          if (livesRef.current <= 0) {
            gameStateRef.current = 'lost';
            setGameState('lost');
            return;
          }
        }
        if (obs.y > H) {
          obs.passed = true;
        }
      }

      for (const coin of coinsRef.current) {
        if (coin.collected) continue;
        const dist = Math.sqrt(
          Math.pow(playerX + PLAYER_W/2 - coin.x - COIN_SIZE/2, 2) +
          Math.pow(playerY + PLAYER_H/2 - coin.y - COIN_SIZE/2, 2)
        );
        if (dist < 35) {
          coin.collected = true;
          scoreRef.current += 10;
          setScore(scoreRef.current);
        }
        if (coin.y > H) {
          coin.collected = true;
        }
      }

      obstaclesRef.current = obstaclesRef.current.filter(o => !o.passed);
      coinsRef.current = coinsRef.current.filter(c => !c.collected);

      if (frameRef.current % 100 === 0) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }
    }, 16);
    return () => clearInterval(anim);
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = setInterval(() => {
      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#2d2d44';
      ctx.fillRect(0, GROUND_Y + PLAYER_H, W, H - GROUND_Y - PLAYER_H);

      ctx.strokeStyle = '#4a4a6a';
      ctx.lineWidth = 2;
      for (let i = 1; i <= 2; i++) {
        const x = 120 * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.lineTo(30, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W - 30, 0);
      ctx.lineTo(W - 30, H);
      ctx.stroke();

      for (const coin of coinsRef.current) {
        if (coin.collected) continue;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(coin.x + COIN_SIZE/2, coin.y + COIN_SIZE/2, COIN_SIZE/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffed4a';
        ctx.beginPath();
        ctx.arc(coin.x + COIN_SIZE/2, coin.y + COIN_SIZE/2, COIN_SIZE/4, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const obs of obstaclesRef.current) {
        if (obs.type === 'train') {
          ctx.fillStyle = '#e74c3c';
          ctx.fillRect(obs.x - 10, obs.y, OBSTACLE_W + 20, OBSTACLE_H);
          ctx.fillStyle = '#c0392b';
          ctx.fillRect(obs.x, obs.y + 10, OBSTACLE_W, OBSTACLE_H - 20);
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(obs.x + 10, obs.y + 20, 3, 0, Math.PI * 2);
          ctx.arc(obs.x + 20, obs.y + 20, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#95a5a6';
          ctx.fillRect(obs.x, obs.y, OBSTACLE_W, OBSTACLE_H);
          ctx.fillStyle = '#7f8c8d';
          ctx.fillRect(obs.x + 5, obs.y + 5, OBSTACLE_W - 10, OBSTACLE_H - 10);
        }
      }

      const px = playerRef.current;
      const py = GROUND_Y;

      ctx.fillStyle = '#3498db';
      ctx.fillRect(px, py, PLAYER_W, PLAYER_H);
      
      ctx.fillStyle = '#2980b9';
      ctx.fillRect(px + 5, py + 5, PLAYER_W - 10, 20);
      
      ctx.fillStyle = '#ecf0f1';
      ctx.beginPath();
      ctx.arc(px + 12, py + 12, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px + 28, py + 12, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(px + 20, py + 8, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#27ae60';
      ctx.beginPath();
      ctx.moveTo(px + PLAYER_W, py + 15);
      ctx.lineTo(px + PLAYER_W + 10, py + 20);
      ctx.lineTo(px + PLAYER_W, py + 25);
      ctx.fill();

    }, 16);
    return () => clearInterval(draw);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: '#0a0a1a' }}>
      <motion.h1 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="text-2xl font-bold mb-4"
        style={{ color: '#3498db' }}
      >
        🚇 地铁跑酷
      </motion.h1>
      
      <div className="flex gap-6 mb-4">
        <span className="text-white">分数: <span style={{ color: '#ffd700' }}>{score}</span></span>
        <span className="text-white">生命: {'❤️'.repeat(lives)}</span>
      </div>

      <canvas 
        ref={canvasRef} 
        width={W} 
        height={H} 
        style={{ 
          border: '3px solid #3498db', 
          borderRadius: '12px',
          boxShadow: '0 0 20px rgba(52, 152, 219, 0.3)'
        }} 
      />

      <div className="text-gray-400 text-sm mt-4">
        使用 ← → 或 A D 键控制左右移动，躲避障碍物收集金币！
      </div>

      {gameState === 'lost' && (
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }}
          className="mt-4 text-xl font-bold"
          style={{ color: '#e74c3c' }}
        >
          💀 游戏结束! 得分: {score}
        </motion.div>
      )}

      <div className="flex gap-4 mt-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startGame}
          className="px-6 py-3 rounded-lg font-bold text-black"
          style={{ backgroundColor: '#3498db' }}
        >
          {gameState === 'idle' ? '开始游戏' : '重新开始'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-lg font-bold text-white"
          style={{ backgroundColor: '#333' }}
        >
          返回首页
        </motion.button>
      </div>
    </div>
  );
}