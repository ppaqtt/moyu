import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../utils/constants';
import { QuickMemoryEngine, Tile } from './engine';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;
const GRID_SIZE = 4;
const CELL_SIZE = 100;
const GAP = 20;

const CARD_BACK_COLORS = ['#ff6b9d', '#00d2ff', '#a855f7', '#22c55e'];
const CARD_VALUES = ['1', '2', '3', '4', '5', '6', '7', '8'];

export default function QuickMemory() {
  const navigate = useNavigate();
  const [engine] = useState(() => new QuickMemoryEngine());
  const [state, setState] = useState(() => engine.getState());
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [highScore, setHighScore] = useLocalStorage(STORAGE_KEYS.QUICK_MEMORY || 'quickmemory_highscore', 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawTile = useCallback((ctx: CanvasRenderingContext2D, tile: Tile) => {
    const { x, y, size, value, isRevealed, isMatched, animationState } = tile;

    ctx.save();

    if (animationState === 'matched') {
      const gradient = ctx.createRadialGradient(x + size / 2, y + size / 2, 0, x + size / 2, y + size / 2, size);
      gradient.addColorStop(0, 'rgba(0, 255, 136, 0.8)');
      gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - 10, y - 10, size + 20, size + 20);
    }

    if (animationState === 'wrong') {
      const gradient = ctx.createRadialGradient(x + size / 2, y + size / 2, 0, x + size / 2, y + size / 2, size);
      gradient.addColorStop(0, 'rgba(255, 0, 68, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 0, 68, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - 10, y - 10, size + 20, size + 20);
    }

    if (value === 0) {
      ctx.fillStyle = 'rgba(26, 26, 46, 0.3)';
      ctx.fillRect(x, y, size, size);
      ctx.restore();
      return;
    }

    const backColor = CARD_BACK_COLORS[(value - 1) % CARD_BACK_COLORS.length];

    if (isRevealed || isMatched) {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = backColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);

      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = backColor;
      ctx.shadowColor = backColor;
      ctx.shadowBlur = 10;
      ctx.fillText(CARD_VALUES[value - 1] || '', x + size / 2, y + size / 2);
    } else {
      const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
      gradient.addColorStop(0, backColor);
      gradient.addColorStop(1, '#1a1a2e');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, size, size);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 4, y + 4, size - 8, size - 8);

      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText('?', x + size / 2, y + size / 2);
    }

    ctx.restore();
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(10, 10, 26, 0.95)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    state.tiles.forEach(tile => {
      drawTile(ctx, tile);
    });

    if (state.phase === 'showing' && !state.isGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#00D2FF';
      ctx.shadowColor = '#00D2FF';
      ctx.shadowBlur = 20;
      ctx.fillText('记忆数字位置!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

      ctx.font = '24px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 0;
      ctx.fillText(`${state.round} / 8`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }

    if (gameStatus === 'idle') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 20;
      ctx.fillText('🧠 快速记忆 🧠', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

      ctx.font = '24px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 10;
      ctx.fillText('点击开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }

    if (gameStatus === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FF6B9D';
      ctx.shadowColor = '#FF6B9D';
      ctx.shadowBlur = 20;
      ctx.fillText('⏰ 时间到! ⏰', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.fillText(`最终得分: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

      ctx.font = '24px Arial';
      ctx.fillStyle = '#00D2FF';
      ctx.shadowColor = '#00D2FF';
      ctx.fillText(`完成回合: ${state.round - 1}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);

      if (engine.getReactionTime() > 0) {
        ctx.fillText(`平均反应: ${engine.getReactionTime()}ms`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 65);
      }
    }
  }, [state, gameStatus, engine, drawTile]);

  useEffect(() => {
    if (gameStatus !== 'playing') {
      render();
      return;
    }

    const interval = setInterval(() => {
      engine.tick();
      setState({ ...engine.getState() });

      if (engine.checkGameOver()) {
        setGameStatus('gameover');
        if (state.score > highScore) {
          setHighScore(state.score);
        }
      }
    }, 16);

    const animationId = requestAnimationFrame(function animate() {
      render();
      if (gameStatus === 'playing') {
        requestAnimationFrame(animate);
      }
    });

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animationId);
    };
  }, [gameStatus, engine, render, state.score, highScore, setHighScore]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (gameStatus === 'idle') {
      setGameStatus('playing');
      return;
    }

    if (gameStatus === 'playing') {
      const padding = (CANVAS_WIDTH - GRID_SIZE * CELL_SIZE - (GRID_SIZE - 1) * GAP) / 2;
      const col = Math.floor((x - padding + GAP / 2) / (CELL_SIZE + GAP));
      const row = Math.floor((y - padding + GAP / 2) / (CELL_SIZE + GAP));

      if (col >= 0 && col < GRID_SIZE && row >= 0 && row < GRID_SIZE) {
        const id = row * GRID_SIZE + col;
        engine.handleClick(id);
        setState({ ...engine.getState() });
      }
    }
  }, [gameStatus, engine]);

  const handleStart = useCallback(() => {
    engine.reset();
    setState({ ...engine.getState() });
    setGameStatus('playing');
  }, [engine]);

  const handleRestart = useCallback(() => {
    engine.reset();
    setState({ ...engine.getState() });
    setGameStatus('playing');
  }, [engine]);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div
      className="flex flex-col items-center gap-4 p-4 rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
        minHeight: '100vh'
      }}
    >
      <div className="flex items-center justify-between w-full max-w-[600px] px-4 pt-4">
        <motion.button
          onClick={handleBack}
          className="px-4 py-2 rounded-lg font-bold text-sm transition-all"
          style={{
            backgroundColor: 'rgba(26, 26, 46, 0.8)',
            color: '#00D2FF',
            boxShadow: '0 0 10px rgba(0, 210, 255, 0.3)',
            border: '1px solid rgba(0, 210, 255, 0.3)',
            backdropFilter: 'blur(10px)'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回主页
        </motion.button>

        <div className="flex items-center gap-6">
          <div
            className="px-4 py-2 rounded-lg text-center"
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 215, 0, 0.3)'
            }}
          >
            <div className="text-xs opacity-70" style={{ color: '#FFD700' }}>最高分</div>
            <div className="text-xl font-bold" style={{ color: '#FFD700' }}>{highScore}</div>
          </div>

          <div
            className="px-4 py-2 rounded-lg text-center"
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 107, 157, 0.3)'
            }}
          >
            <div className="text-xs opacity-70" style={{ color: '#FF6B9D' }}>当前得分</div>
            <div className="text-xl font-bold" style={{ color: '#FF6B9D' }}>{state.score}</div>
          </div>

          <div
            className="px-4 py-2 rounded-lg text-center"
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 210, 255, 0.3)'
            }}
          >
            <div className="text-xs opacity-70" style={{ color: '#00D2FF' }}>剩余时间</div>
            <div
              className="text-xl font-bold"
              style={{ color: state.timeLeft <= 10 ? '#FF4444' : '#00D2FF' }}
            >
              {state.timeLeft}s
            </div>
          </div>
        </div>
      </div>

      <motion.div
        className="relative rounded-2xl overflow-hidden"
        style={{
          boxShadow: '0 0 30px rgba(0, 210, 255, 0.3)',
          border: '2px solid rgba(0, 210, 255, 0.3)'
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          className="cursor-pointer"
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto'
          }}
        />

        <AnimatePresence>
          {gameStatus === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{
                backgroundColor: 'rgba(15, 15, 26, 0.9)',
                backdropFilter: 'blur(10px)'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-5xl mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                🧠
              </motion.div>

              <motion.h2
                className="text-4xl font-bold mb-2"
                style={{ color: '#FF6B9D' }}
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                游戏结束!
              </motion.h2>

              <motion.div
                className="text-3xl font-bold mb-4"
                style={{ color: '#FFD700' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                得分: {state.score}
              </motion.div>

              <motion.div
                className="text-lg mb-4"
                style={{ color: '#00D2FF' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                完成回合: {state.round - 1}
              </motion.div>

              {state.score >= highScore && state.score > 0 && (
                <motion.div
                  className="text-xl font-bold mb-4"
                  style={{ color: '#00FF88' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  🎉 新纪录! 🎉
                </motion.div>
              )}

              <motion.div
                className="flex gap-4"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  onClick={handleRestart}
                  className="px-8 py-3 rounded-xl font-bold text-lg transition-all"
                  style={{
                    backgroundColor: '#FF6B9D',
                    color: '#FFFFFF',
                    boxShadow: '0 0 20px rgba(255, 107, 157, 0.5)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  再来一局
                </motion.button>

                <motion.button
                  onClick={handleBack}
                  className="px-8 py-3 rounded-xl font-bold text-lg transition-all"
                  style={{
                    backgroundColor: 'rgba(26, 26, 46, 0.8)',
                    color: '#00D2FF',
                    border: '2px solid #00D2FF',
                    backdropFilter: 'blur(10px)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  返回主页
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        className="mt-4 px-6 py-3 rounded-xl text-center"
        style={{
          backgroundColor: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(168, 85, 247, 0.3)'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="text-sm opacity-70" style={{ color: '#A855F7' }}>
          {gameStatus === 'idle' && '点击画布开始游戏'}
          {gameStatus === 'playing' && state.phase === 'showing' && '记住数字的位置!'}
          {gameStatus === 'playing' && state.phase === 'playing' && '找出相同的数字!'}
          {gameStatus === 'playing' && state.phase === 'result' && '太棒了! 准备下一轮...'}
          {gameStatus === 'gameover' && '按"再来一局"重新开始'}
        </div>
      </motion.div>

      {gameStatus === 'playing' && state.phase === 'playing' && (
        <motion.div
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl"
          style={{
            backgroundColor: 'rgba(26, 26, 46, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(57, 255, 20, 0.3)'
          }}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-4">
            <div className="text-sm" style={{ color: '#39FF14' }}>
              回合: <span className="font-bold text-lg">{state.round}</span>
            </div>
            <div className="text-sm" style={{ color: '#A855F7' }}>
              配对: <span className="font-bold text-lg">{state.matchCount}/{state.totalPairs}</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
