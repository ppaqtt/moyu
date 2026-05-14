import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { DANCING_LINE_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { DancingLineEngine, GameDancingState } from './engine';

type GameStatus = 'idle' | 'playing' | 'gameover';

const BG_GRADIENT = 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)';

export default function DancingLine() {
  const navigate = useNavigate();
  const [engine] = useState(() => new DancingLineEngine());
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [perfectFeedback, setPerfectFeedback] = useState<string | null>(null);
  const [highScore, setHighScore] = useLocalStorage<number>(STORAGE_KEYS.DANCING_LINE, 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastRenderRef = useRef<number>(0);

  const { width, height } = engine.getCanvasSize();

  const render = useCallback((state: GameDancingState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cameraX = state.headPosition.x - width / 3;

    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, width, height);

    const gridSize = 50;
    const gridOffsetX = -(cameraX % gridSize);
    ctx.strokeStyle = 'rgba(108, 92, 231, 0.1)';
    ctx.lineWidth = 1;

    for (let x = gridOffsetX; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw path segments
    if (state.lineSegments.length > 0) {
      ctx.beginPath();
      const firstSeg = state.lineSegments[0];
      ctx.moveTo(firstSeg.start.x - cameraX, firstSeg.start.y);
      for (const seg of state.lineSegments) {
        ctx.lineTo(seg.end.x - cameraX, seg.end.y);
      }
      ctx.strokeStyle = '#6c5ce7';
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    // Draw head glow
    const headScreenX = state.headPosition.x - cameraX;

    ctx.beginPath();
    ctx.arc(headScreenX, state.headPosition.y, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(headScreenX, state.headPosition.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Draw obstacles
    state.obstacles.forEach(obs => {
      const screenX = obs.x - cameraX;
      if (screenX < -100 || screenX > width + 100) return;

      ctx.fillStyle = obs.color || (obs.type === 'static' ? '#ff6b6b' : '#ffa502');
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;

      ctx.fillRect(screenX, obs.y, obs.width, obs.height);
      ctx.shadowBlur = 0;

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX, obs.y, obs.width, obs.height);
    });

    // Draw nodes
    state.nodes.forEach(node => {
      const screenX = node.x - cameraX;
      if (screenX < -100 || screenX > width + 100) return;

      ctx.beginPath();
      ctx.arc(screenX, node.y, node.radius, 0, Math.PI * 2);

      const gradient = ctx.createRadialGradient(screenX, node.y, 0, screenX, node.y, node.radius);
      gradient.addColorStop(0, node.hit ? '#4a4a6a' : '#ffd700');
      gradient.addColorStop(1, node.hit ? '#2d2d44' : '#ff9500');
      ctx.fillStyle = gradient;

      if (!node.hit) {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = node.hit ? '#666' : '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [width, height]);

  const gameLoop = useCallback((timestamp: number) => {
    if (gameStatus !== 'playing') return;

    const deltaTime = timestamp - lastRenderRef.current;
    lastRenderRef.current = timestamp;

    if (deltaTime >= 16) {
      engine.tick();

      const state = engine.getState();
      setScore(state.score);
      setLives(state.lives);
      setCombo(state.combo);

      if (state.isGameOver) {
        setGameStatus('gameover');
        if (state.score > highScore) {
          setHighScore(state.score);
        }
        return;
      }

      render(state);
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameStatus, engine, render, highScore, setHighScore]);

  useEffect(() => {
    if (gameStatus === 'playing') {
      lastRenderRef.current = performance.now();
      engine.start();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameStatus, gameLoop, engine]);

  const startGame = () => {
    engine.reset();
    setScore(0);
    setLives(3);
    setCombo(0);
    setGameStatus('playing');
    render(engine.getState());
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameStatus !== 'playing') return;

    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        engine.turnLeft();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        engine.turnRight();
        break;
      case ' ':
      case 'ArrowUp':
      case 'w':
      case 'W':
        engine.jump();
        break;
    }
  }, [gameStatus, engine]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);

  const handleNodeClick = () => {
    if (gameStatus !== 'playing') return;

    const result = engine.tryHitNode();
    if (result.hit) {
      setPerfectFeedback(result.perfect ? 'PERFECT!' : 'GOOD!');
      setTimeout(() => setPerfectFeedback(null), 1000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
         style={{ background: BG_GRADIENT }}>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-6"
      >
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
          跳舞的线 Dancing Line
        </h1>
        <p className="text-gray-400">跟随节奏，让线条穿过障碍！</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-6 mb-4"
      >
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">分数</div>
          <div className="text-2xl font-bold text-yellow-400">{score}</div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">连击</div>
          <div className="text-2xl font-bold text-pink-400">{combo}x</div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">生命</div>
          <div className="text-2xl font-bold text-red-400">{'❤️'.repeat(lives)}</div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">最高分</div>
          <div className="text-2xl font-bold text-cyan-400">{highScore}</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative"
      >
        <div className="glass-card rounded-2xl p-4">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="rounded-xl cursor-pointer"
            onClick={handleNodeClick}
            style={{
              boxShadow: '0 0 30px rgba(108, 92, 231, 0.3), inset 0 0 60px rgba(0, 0, 0, 0.3)'
            }}
          />

          <AnimatePresence>
            {perfectFeedback && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-bold text-yellow-400"
                style={{ textShadow: '0 0 20px #ffd700' }}
              >
                {perfectFeedback}
              </motion.div>
            )}
          </AnimatePresence>

          {(gameStatus === 'idle' || gameStatus === 'gameover') && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                {gameStatus === 'gameover' && (
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-red-500 mb-2">游戏结束</div>
                    <div className="text-xl text-yellow-400">最终得分: {score}</div>
                    {score >= highScore && score > 0 && (
                      <div className="text-lg text-green-400 mt-2">🎉 新纪录！</div>
                    )}
                  </div>
                )}
                <button
                  onClick={startGame}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  {gameStatus === 'idle' ? '开始游戏' : '再来一局'}
                </button>
              </motion.div>
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-between items-center mt-4 px-2"
        >
          <div className="text-gray-400 text-sm">
            ← → 转弯 | 空格 跳跃
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
          >
            🏠 返回主页
          </button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 max-w-2xl text-center"
      >
        <div className="glass-card px-6 py-4 rounded-xl">
          <h3 className="text-lg font-semibold text-purple-400 mb-2">🎯 游戏技巧</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• 使用 ← → 键控制线条移动方向</li>
            <li>• 点击金色圆圈可以获得分数</li>
            <li>• 躲避红色和橙色的障碍物</li>
            <li>• 连续收集节点可以获得连击加成</li>
          </ul>
        </div>
      </motion.div>

      <style>{`
        .glass-card {
          background: rgba(26, 26, 46, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(108, 92, 231, 0.3);
        }
      `}</style>
    </div>
  );
}
