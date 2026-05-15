import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { SKIING_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { SkiingEngine, ObstacleType, PowerUpType } from './engine';

type GameStatus = 'idle' | 'playing' | 'gameover';

export default function Skiing() {
  const navigate = useNavigate();
  const [engine] = useState(() => new SkiingEngine());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [distance, setDistance] = useState(0);
  const [bestScore, setBestScore] = useLocalStorage(STORAGE_KEYS.SKIING, 0);
  
  const { width, height } = engine.getCanvasSize();
  const playerSize = engine.getPlayerSize();
  const obstacleSize = engine.getObstacleSize();

  const drawTree = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#2d5a27';
    ctx.beginPath();
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x - 15, y + 10);
    ctx.lineTo(x + 15, y + 10);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#4a3728';
    ctx.fillRect(x - 4, y + 10, 8, 12);
  }, []);

  const drawRock = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#6b6b6b';
    ctx.beginPath();
    ctx.ellipse(x, y, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#8a8a8a';
    ctx.beginPath();
    ctx.ellipse(x - 5, y - 3, 8, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const drawFlagGate = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 20, y - 15);
    ctx.lineTo(x - 20, y + 15);
    ctx.moveTo(x + 20, y - 15);
    ctx.lineTo(x + 20, y + 15);
    ctx.stroke();
    
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.moveTo(x - 20, y - 15);
    ctx.lineTo(x + 20, y - 15);
    ctx.lineTo(x, y - 5);
    ctx.closePath();
    ctx.fill();
  }, []);

  const drawSnowMountain = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const gradient = ctx.createLinearGradient(x - 25, y, x + 25, y);
    gradient.addColorStop(0, '#bdc3c7');
    gradient.addColorStop(0.5, '#ecf0f1');
    gradient.addColorStop(1, '#bdc3c7');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x, y - 25);
    ctx.lineTo(x - 25, y + 15);
    ctx.lineTo(x + 25, y + 15);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x, y - 25);
    ctx.lineTo(x - 8, y - 5);
    ctx.lineTo(x + 8, y - 5);
    ctx.closePath();
    ctx.fill();
  }, []);

  const drawSpeedBoost = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#3498db';
    ctx.fillRect(x - 12, y - 8, 24, 16);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('>>>', x, y);
  }, []);

  const drawScoreFlag = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x + 15, y - 6);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x, y + 10);
    ctx.stroke();
  }, []);

  const drawSkier = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, isJumping: boolean) => {
    ctx.save();
    ctx.translate(x, y);
    
    if (isJumping) {
      ctx.rotate(-0.2);
    }
    
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.ellipse(0, -8, 10, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 20);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, 8);
    ctx.lineTo(12, 8);
    ctx.stroke();
    
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(-3, -10, 2, 0, Math.PI * 2);
    ctx.arc(3, -10, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }, []);

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#87CEEB');
    bgGradient.addColorStop(0.3, '#b8d4e8');
    bgGradient.addColorStop(0.6, '#d4e5f7');
    bgGradient.addColorStop(1, '#f0f4f8');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const y = (i * 50 + (Date.now() / 50) % 50) % height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    const laneWidth = width / 3;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(laneWidth * i, 0);
      ctx.lineTo(laneWidth * i, height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.lineTo(width, height - 60);
    ctx.lineTo(0, height - 60);
    ctx.closePath();
    ctx.fill();
  }, [width, height]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = engine.getState();
    
    drawBackground(ctx);
    
    state.powerUps.forEach(powerUp => {
      if (powerUp.type === 'speed_boost') {
        drawSpeedBoost(ctx, powerUp.x, powerUp.y);
      } else {
        drawScoreFlag(ctx, powerUp.x, powerUp.y);
      }
    });
    
    state.obstacles.forEach(obstacle => {
      switch (obstacle.type) {
        case 'tree':
          drawTree(ctx, obstacle.x, obstacle.y);
          break;
        case 'rock':
          drawRock(ctx, obstacle.x, obstacle.y);
          break;
        case 'flag_gate':
          drawFlagGate(ctx, obstacle.x, obstacle.y);
          break;
        case 'snow_mountain':
          drawSnowMountain(ctx, obstacle.x, obstacle.y);
          break;
      }
    });
    
    drawSkier(ctx, state.player.x, state.player.y, state.player.isJumping);
  }, [engine, drawBackground, drawTree, drawRock, drawFlagGate, drawSnowMountain, drawSpeedBoost, drawScoreFlag, drawSkier]);

  const gameLoopRef = useRef<number | null>(null);

  const gameLoop = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setScore(state.score);
    setLives(state.lives);
    setDistance(Math.floor(state.distance));
    render();

    if (state.isGameOver) {
      setGameStatus('gameover');
      if (state.score > bestScore) {
        setBestScore(state.score);
      }
    } else {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [engine, render, bestScore, setBestScore]);

  const startGame = useCallback(() => {
    engine.reset();
    engine.start();
    setGameStatus('playing');
    setScore(0);
    setLives(3);
    setDistance(0);
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [engine, gameLoop]);

  useEffect(() => {
    render();
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [render]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          engine.moveLeft();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          engine.moveRight();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          e.preventDefault();
          engine.jump();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          engine.speedBoost();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [engine, gameStatus]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (gameStatus !== 'playing') return;
    
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = touch.clientX - rect.left;
    const third = width / 3;
    
    if (x < third) {
      engine.moveLeft();
    } else if (x > third * 2) {
      engine.moveRight();
    } else {
      engine.jump();
    }
  }, [engine, gameStatus, width]);

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' }}
    >
      <div className="w-full max-w-[640px]">
        <div className="flex items-center justify-between mb-4 px-2">
          <motion.button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-lg font-bold text-sm"
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.8)',
              color: '#00d2ff',
              boxShadow: '0 0 10px rgba(0, 210, 255, 0.4)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 210, 255, 0.3)'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            返回主页
          </motion.button>

          <div className="flex gap-6">
            <div className="text-center" style={{ backgroundColor: 'rgba(26, 26, 46, 0.8)', backdropFilter: 'blur(10px)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
              <div className="text-xs opacity-70" style={{ color: '#ffd700' }}>分数</div>
              <div className="text-2xl font-bold" style={{ color: '#ff6b9d' }}>{score}</div>
            </div>

            <div className="text-center" style={{ backgroundColor: 'rgba(26, 26, 46, 0.8)', backdropFilter: 'blur(10px)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(0, 210, 255, 0.3)' }}>
              <div className="text-xs opacity-70" style={{ color: '#ffd700' }}>生命</div>
              <div className="text-2xl font-bold" style={{ color: '#39ff14' }}>
                {'❤️'.repeat(lives)}
              </div>
            </div>

            <div className="text-center" style={{ backgroundColor: 'rgba(26, 26, 46, 0.8)', backdropFilter: 'blur(10px)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
              <div className="text-xs opacity-70" style={{ color: '#ffd700' }}>距离</div>
              <div className="text-2xl font-bold" style={{ color: '#a855f7' }}>{distance}m</div>
            </div>
          </div>

          <div className="text-center" style={{ backgroundColor: 'rgba(26, 26, 46, 0.8)', backdropFilter: 'blur(10px)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
            <div className="text-xs opacity-70" style={{ color: '#ffd700' }}>最高</div>
            <div className="text-xl font-bold" style={{ color: '#00d2ff' }}>{bestScore}</div>
          </div>
        </div>

        <div 
          className="relative rounded-2xl overflow-hidden cursor-pointer select-none"
          style={{
            boxShadow: '0 0 30px rgba(168, 85, 247, 0.3)',
            border: '2px solid rgba(168, 85, 247, 0.4)'
          }}
          onTouchStart={handleTouchStart}
        >
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{ display: 'block' }}
          />

          {gameStatus === 'idle' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(15, 15, 26, 0.9)', backdropFilter: 'blur(5px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-6xl mb-4">⛷️</div>
              <div className="text-4xl font-bold mb-2" style={{ color: '#ffffff' }}>
                滑雪大冒险
              </div>
              <div className="text-lg mb-6 opacity-70" style={{ color: '#a855f7' }}>
                从山顶极速滑下，躲避障碍！
              </div>
              <div className="text-sm mb-8 opacity-60" style={{ color: '#ffd700' }}>
                <div>← → 或 A D 切换滑道</div>
                <div>↑ 或 W 或空格 跳跃</div>
                <div>↓ 或 S 加速</div>
              </div>
              <motion.button
                onClick={startGame}
                className="px-12 py-4 rounded-xl text-2xl font-bold"
                style={{
                  backgroundColor: '#e74c3c',
                  color: '#ffffff',
                  boxShadow: '0 0 30px #e74c3c'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开始游戏
              </motion.button>
            </motion.div>
          )}

          {gameStatus === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(15, 15, 26, 0.9)', backdropFilter: 'blur(5px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-5xl font-bold mb-4" style={{ color: '#e74c3c' }}>
                游戏结束
              </div>
              <div className="text-3xl mb-2" style={{ color: '#ffd700' }}>
                得分: {score}
              </div>
              <div className="text-xl mb-2" style={{ color: '#00d2ff' }}>
                距离: {distance}m
              </div>
              <div className="text-xl mb-6" style={{ color: score > bestScore - score ? '#39ff14' : '#a855f7' }}>
                最高: {bestScore}
              </div>
              {score > bestScore - score && (
                <div className="text-2xl mb-4 animate-pulse" style={{ color: '#39ff14' }}>
                  🎉 新纪录！🎉
                </div>
              )}
              <motion.button
                onClick={startGame}
                className="px-10 py-4 rounded-xl text-xl font-bold"
                style={{
                  backgroundColor: '#e74c3c',
                  color: '#ffffff',
                  boxShadow: '0 0 20px #e74c3c'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                再来一局
              </motion.button>
            </motion.div>
          )}
        </div>

        <div className="mt-4 text-center opacity-60 text-sm" style={{ color: '#ffd700' }}>
          <div>左右滑动切换滑道，中间滑动跳跃</div>
          <div style={{ color: '#a855f7' }}>收集黄色旗帜获得100分，蓝色加速带获得50分并加速</div>
        </div>
      </div>
    </div>
  );
}
