import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { SNAKE_DUO_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { SnakeDuoEngine, Direction, Player, SnakeDuoState, Position } from './engine';

const { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE } = SNAKE_DUO_CONSTANTS;
const CELL_SIZE = CANVAS_WIDTH / GRID_SIZE;

type GameState = 'idle' | 'playing' | 'gameover';

interface HighScores {
  player1Best: number;
  player2Best: number;
}

export default function SnakeDuo() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SnakeDuoEngine | null>(null);
  const keysRef = useRef<{ p1: Direction | null; p2: Direction | null }>({ p1: null, p2: null });

  const [gameState, setGameState] = useState<GameState>('idle');
  const [state, setState] = useState<SnakeDuoState | null>(null);
  const [highScores, setHighScores] = useLocalStorage<HighScores>(STORAGE_KEYS.SNAKE_DUO, {
    player1Best: 0,
    player2Best: 0
  });

  useEffect(() => {
    engineRef.current = new SnakeDuoEngine();
    setState(engineRef.current.getState());
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!engineRef.current) return;

    const updateDirection = (player: Player, dir: Direction) => {
      engineRef.current?.setDirection(player, dir);
    };

    switch (e.key.toLowerCase()) {
      case 'w':
        if (!keysRef.current.p1 || keysRef.current.p1 !== 'up') {
          keysRef.current.p1 = 'up';
          updateDirection(1, 'up');
        }
        e.preventDefault();
        break;
      case 's':
        if (!keysRef.current.p1 || keysRef.current.p1 !== 'down') {
          keysRef.current.p1 = 'down';
          updateDirection(1, 'down');
        }
        e.preventDefault();
        break;
      case 'a':
        if (!keysRef.current.p1 || keysRef.current.p1 !== 'left') {
          keysRef.current.p1 = 'left';
          updateDirection(1, 'left');
        }
        e.preventDefault();
        break;
      case 'd':
        if (!keysRef.current.p1 || keysRef.current.p1 !== 'right') {
          keysRef.current.p1 = 'right';
          updateDirection(1, 'right');
        }
        e.preventDefault();
        break;
      case 'arrowup':
        if (!keysRef.current.p2 || keysRef.current.p2 !== 'up') {
          keysRef.current.p2 = 'up';
          updateDirection(2, 'up');
        }
        e.preventDefault();
        break;
      case 'arrowdown':
        if (!keysRef.current.p2 || keysRef.current.p2 !== 'down') {
          keysRef.current.p2 = 'down';
          updateDirection(2, 'down');
        }
        e.preventDefault();
        break;
      case 'arrowleft':
        if (!keysRef.current.p2 || keysRef.current.p2 !== 'left') {
          keysRef.current.p2 = 'left';
          updateDirection(2, 'left');
        }
        e.preventDefault();
        break;
      case 'arrowright':
        if (!keysRef.current.p2 || keysRef.current.p2 !== 'right') {
          keysRef.current.p2 = 'right';
          updateDirection(2, 'right');
        }
        e.preventDefault();
        break;
      case ' ':
        if (gameState === 'idle') {
          engineRef.current?.start();
          setGameState('playing');
        } else if (gameState === 'gameover') {
          handleRestart();
        }
        e.preventDefault();
        break;
      case 'escape':
        if (gameState === 'playing') {
          engineRef.current?.pause();
          setGameState('idle');
        }
        break;
    }
  }, [gameState]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleTick = useCallback(() => {
    if (!engineRef.current) return;
    
    engineRef.current.tick();
    const newState = engineRef.current.getState();
    setState(newState);

    if (newState.gameStatus === 'gameover') {
      setGameState('gameover');
      
      setHighScores(prev => ({
        player1Best: Math.max(prev.player1Best, newState.scores.player1.score),
        player2Best: Math.max(prev.player2Best, newState.scores.player2.score)
      }));
    }
  }, [setHighScores]);

  useGameLoop({
    callback: handleTick,
    delay: engineRef.current?.getSpeed() || SNAKE_DUO_CONSTANTS.INITIAL_SPEED,
    enabled: gameState === 'playing'
  });

  useEffect(() => {
    if (!canvasRef.current || !state) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_WIDTH, i * CELL_SIZE);
      ctx.stroke();
    }

    const drawSnake = (snake: typeof state.player1) => {
      snake.segments.forEach((segment, index) => {
        const isHead = index === 0;
        const ratio = index / snake.segments.length;
        
        ctx.fillStyle = snake.color;
        ctx.shadowColor = snake.glowColor;
        ctx.shadowBlur = isHead ? 15 : 5;
        
        const x = segment.x * CELL_SIZE;
        const y = segment.y * CELL_SIZE;
        const size = CELL_SIZE - 2;
        
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, isHead ? 6 : 4);
        ctx.fill();

        if (isHead && snake.alive) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 0;
          const eyeSize = 4;
          const eyeOffset = size / 4;
          
          if (snake.direction === 'up' || snake.direction === 'down') {
            ctx.beginPath();
            ctx.arc(x + eyeOffset, y + size / 2, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + size - eyeOffset, y + size / 2, eyeSize, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(x + size / 2, y + eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size - eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
      ctx.shadowBlur = 0;
    };

    if (state.player1.alive) {
      drawSnake(state.player1);
    }
    if (state.player2.alive) {
      drawSnake(state.player2);
    }

    const foodX = state.food.position.x * CELL_SIZE;
    const foodY = state.food.position.y * CELL_SIZE;
    const foodSize = CELL_SIZE - 4;
    
    ctx.fillStyle = state.food.color;
    ctx.shadowColor = state.food.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(foodX + CELL_SIZE / 2, foodY + CELL_SIZE / 2, foodSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

  }, [state]);

  const handleStart = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.start();
    setGameState('playing');
  }, []);

  const handleRestart = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.reset();
    setState(engineRef.current.getState());
    keysRef.current = { p1: null, p2: null };
    setGameState('idle');
  }, []);

  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)'
      }}
    >
      <motion.div
        className="glass-card rounded-3xl p-8 max-w-4xl w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <motion.button
            onClick={handleExit}
            className="px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300"
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.8)',
              color: '#00d2ff',
              border: '1px solid rgba(0, 210, 255, 0.3)'
            }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0, 210, 255, 0.5)' }}
            whileTap={{ scale: 0.95 }}
          >
            返回
          </motion.button>

          <motion.h1 
            className="text-3xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #00d2ff, #ff6b9d)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            双人贪吃蛇
          </motion.h1>

          <div className="w-20" />
        </div>

        <div className="flex justify-between gap-6 mb-6">
          <div 
            className="flex-1 p-4 rounded-xl text-center"
            style={{
              background: 'rgba(0, 210, 255, 0.1)',
              border: '1px solid rgba(0, 210, 255, 0.3)'
            }}
          >
            <div className="text-sm opacity-70 mb-1" style={{ color: '#ffd700' }}>P1 分数</div>
            <div className="text-2xl font-bold" style={{ color: '#00d2ff' }}>
              {state?.scores.player1.score || 0}
            </div>
            <div className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
              蛇长: {state?.player1.segments.length || 3}
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              最高: {highScores.player1Best}
            </div>
            {!state?.player1.alive && gameState === 'gameover' && (
              <motion.div 
                className="text-sm font-bold mt-2"
                style={{ color: '#ff6b6b' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                死亡
              </motion.div>
            )}
          </div>

          <div 
            className="flex-1 p-4 rounded-xl text-center"
            style={{
              background: 'rgba(255, 107, 157, 0.1)',
              border: '1px solid rgba(255, 107, 157, 0.3)'
            }}
          >
            <div className="text-sm opacity-70 mb-1" style={{ color: '#ffd700' }}>P2 分数</div>
            <div className="text-2xl font-bold" style={{ color: '#ff6b9d' }}>
              {state?.scores.player2.score || 0}
            </div>
            <div className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
              蛇长: {state?.player2.segments.length || 3}
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              最高: {highScores.player2Best}
            </div>
            {!state?.player2.alive && gameState === 'gameover' && (
              <motion.div 
                className="text-sm font-bold mt-2"
                style={{ color: '#ff6b6b' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                死亡
              </motion.div>
            )}
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <div 
            className="px-4 py-2 rounded-lg text-center"
            style={{
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)'
            }}
          >
            <div className="text-xs opacity-70" style={{ color: '#ffd700' }}>存活时间</div>
            <div className="text-lg font-bold" style={{ color: '#ffd700' }}>
              {state ? Math.floor(state.elapsedTime / 1000) : 0}秒
            </div>
          </div>
        </div>

        <div className="relative flex justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="rounded-2xl"
            style={{
              boxShadow: '0 0 30px rgba(0, 0, 0, 0.5), inset 0 0 50px rgba(0, 0, 0, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.1)'
            }}
          />

          <AnimatePresence>
            {gameState === 'idle' && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
                style={{ backgroundColor: 'rgba(15, 15, 26, 0.9)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div 
                  className="text-4xl font-bold mb-4"
                  style={{ color: '#ffd700' }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  双人贪吃蛇
                </motion.div>
                <div className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  准备好了吗？
                </div>
                <motion.button
                  onClick={handleStart}
                  className="px-8 py-4 rounded-xl font-bold text-xl"
                  style={{
                    background: 'linear-gradient(135deg, #00d2ff, #6c5ce7)',
                    color: '#ffffff',
                    boxShadow: '0 0 30px rgba(0, 210, 255, 0.5)'
                  }}
                  whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0, 210, 255, 0.7)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  开始游戏 (空格)
                </motion.button>
                <div className="mt-6 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  按 ESC 暂停 | 空格 开始/重新开始
                </div>
              </motion.div>
            )}

            {gameState === 'gameover' && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
                style={{ backgroundColor: 'rgba(15, 15, 26, 0.95)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div 
                  className="text-3xl font-bold mb-4"
                  style={{ 
                    color: state?.winner 
                      ? (state.winner === 1 ? '#00d2ff' : '#ff6b9d')
                      : '#ffd700'
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10 }}
                >
                  {state?.winner 
                    ? `玩家 ${state.winner} 获胜!`
                    : '平局!'}
                </motion.div>

                <div className="flex gap-8 mb-6">
                  <div className="text-center">
                    <div className="text-sm opacity-70" style={{ color: '#00d2ff' }}>P1 最终得分</div>
                    <div className="text-2xl font-bold" style={{ color: '#00d2ff' }}>
                      {state?.scores.player1.score || 0}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm opacity-70" style={{ color: '#ff6b9d' }}>P2 最终得分</div>
                    <div className="text-2xl font-bold" style={{ color: '#ff6b9d' }}>
                      {state?.scores.player2.score || 0}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <motion.button
                    onClick={handleRestart}
                    className="px-6 py-3 rounded-xl font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #00d2ff, #6c5ce7)',
                      color: '#ffffff',
                      boxShadow: '0 0 20px rgba(0, 210, 255, 0.5)'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    再来一局
                  </motion.button>
                  <motion.button
                    onClick={handleExit}
                    className="px-6 py-3 rounded-xl font-bold"
                    style={{
                      backgroundColor: 'rgba(26, 26, 46, 0.8)',
                      color: '#00d2ff',
                      border: '1px solid rgba(0, 210, 255, 0.5)'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    返回首页
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-between mt-6 text-sm">
          <div className="text-center">
            <div className="font-bold mb-1" style={{ color: '#00d2ff' }}>玩家 1 (WASD)</div>
            <div style={{ color: 'rgba(255,255,255,0.5)' }}>
              {state?.player1.alive ? '存活' : '已死亡'}
            </div>
          </div>
          <div className="text-center">
            <div className="font-bold mb-1" style={{ color: '#ff6b9d' }}>玩家 2 (方向键)</div>
            <div style={{ color: 'rgba(255,255,255,0.5)' }}>
              {state?.player2.alive ? '存活' : '已死亡'}
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <div>吃食物得分 + 存活时间奖励</div>
          <div>撞墙、撞自己、撞对方均死亡</div>
        </div>
      </motion.div>
    </div>
  );
}
