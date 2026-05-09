import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { NumberPuzzleEngine } from './engine';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 440;
const CELL_SIZE = 100;
const GAP = 4;

type GameStatus = 'idle' | 'playing' | 'gameover';

export default function NumberPuzzle() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<NumberPuzzleEngine | null>(null);
  const animationFrameRef = useRef<number>(0);

  const [bestScore, setBestScore] = useLocalStorage<number>('numberpuzzle_highscore', 0);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [moveCount, setMoveCount] = useState<number>(0);
  const [gameResult, setGameResult] = useState<string>('');

  const renderGame = useCallback(() => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    engine.render(ctx);

    const state = engine.getState();
    if (state.isSolved) {
      engine.render(ctx);
      const canvas2 = canvasRef.current;
      if (canvas2) {
        const ctx2 = canvas2.getContext('2d');
        if (ctx2) {
          const size = 4;
          const cellSize = 100;
          const gap = 4;
          const totalSize = size * cellSize + (size - 1) * gap;
          const offsetX = (400 - totalSize) / 2;
          const offsetY = (440 - totalSize - 30) / 2;

          ctx2.fillStyle = 'rgba(0, 255, 0, 0.2)';
          ctx2.beginPath();
          ctx2.roundRect(offsetX - 10, offsetY - 10, totalSize + 20, totalSize + 20, 16);
          ctx2.fill();

          ctx2.strokeStyle = '#00ff00';
          ctx2.lineWidth = 4;
          ctx2.shadowColor = '#00ff00';
          ctx2.shadowBlur = 30;
          ctx2.beginPath();
          ctx2.roundRect(offsetX - 10, offsetY - 10, totalSize + 20, totalSize + 20, 16);
          ctx2.stroke();
        }
      }
    }
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine || gameStatus !== 'playing') return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const boardSize = 4;
    const totalSize = boardSize * CELL_SIZE + (boardSize - 1) * GAP;
    const offsetX = (CANVAS_WIDTH - totalSize) / 2;
    const offsetY = (CANVAS_HEIGHT - totalSize - 30) / 2;

    const col = Math.floor((x - offsetX) / (CELL_SIZE + GAP));
    const row = Math.floor((y - offsetY) / (CELL_SIZE + GAP));

    if (row < 0 || row >= boardSize || col < 0 || col >= boardSize) return;

    if (engine.move(row, col)) {
      setMoveCount(prev => prev + 1);
      renderGame();

      const state = engine.getState();
      if (state.isSolved) {
        setGameStatus('gameover');
        setGameResult('恭喜通关！');
        const score = Math.max(0, 1000 - moveCount * 10);
        if (score > bestScore) {
          setBestScore(score);
        }
      }
    }
  }, [gameStatus, renderGame, moveCount, bestScore, setBestScore]);

  useEffect(() => {
    engineRef.current = new NumberPuzzleEngine();

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        engineRef.current.render(ctx);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
      renderGame();
    }
    setGameStatus('playing');
    setMoveCount(0);
    setGameResult('');
  }, [renderGame]);

  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)'
      }}
    >
      <motion.div
        className="glass-card rounded-3xl p-8 max-w-[480px] w-full"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <motion.button
            onClick={handleExit}
            className="px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300"
            style={{
              backgroundColor: NEON_COLORS.darkPurple,
              color: NEON_COLORS.neonBlue,
              boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}40`
            }}
            whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${NEON_COLORS.neonBlue}` }}
            whileTap={{ scale: 0.95 }}
          >
            返回
          </motion.button>

          <h1 className="text-3xl font-bold" style={{ color: NEON_COLORS.gold }}>
            数字推盘
          </h1>

          <div className="text-center">
            <div className="text-xs opacity-60" style={{ color: NEON_COLORS.gold }}>最佳步数</div>
            <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonBlue }}>
              {bestScore > 0 ? bestScore : '-'}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 mb-4">
          <div
            className="px-6 py-3 rounded-xl"
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              border: '2px solid #3b82f6',
              color: NEON_COLORS.white
            }}
          >
            <span className="text-sm opacity-70">移动步数</span>
            <span className="text-2xl font-bold ml-2">{moveCount}</span>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <div
            className="px-4 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: NEON_COLORS.darkPurple,
              color: NEON_COLORS.neonPink,
              border: `1px solid ${NEON_COLORS.neonPink}40`
            }}
          >
            {gameStatus === 'idle' && '点击开始游戏'}
            {gameStatus === 'playing' && '点击数字滑动拼图'}
            {gameStatus === 'gameover' && gameResult}
          </div>
        </div>

        <motion.div
          className="relative mx-auto"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30, inset 0 0 50px rgba(0,0,0,0.5)`,
            border: `2px solid ${NEON_COLORS.neonPink}40`
          }}
          whileHover={{ boxShadow: `0 0 40px ${NEON_COLORS.neonPink}50` }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onClick={handleCanvasClick}
            className="cursor-pointer"
            style={{
              display: 'block',
              width: '100%',
              height: '100%'
            }}
          />

          <AnimatePresence>
            {gameStatus === 'idle' && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ backgroundColor: 'rgba(15, 15, 26, 0.9)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-3xl font-bold mb-8" style={{ color: NEON_COLORS.gold }}>
                  数字推盘
                </h2>
                <p className="text-lg mb-8 opacity-70" style={{ color: NEON_COLORS.white }}>
                  华容道数字滑块，挑战最少步数！
                </p>
                <motion.button
                  onClick={startGame}
                  className="px-8 py-4 rounded-xl font-bold text-xl"
                  style={{
                    backgroundColor: NEON_COLORS.neonPink,
                    color: NEON_COLORS.white,
                    boxShadow: `0 0 30px ${NEON_COLORS.neonPink}`
                  }}
                  whileHover={{ scale: 1.05, boxShadow: `0 0 50px ${NEON_COLORS.neonPink}` }}
                  whileTap={{ scale: 0.95 }}
                >
                  开始游戏
                </motion.button>
              </motion.div>
            )}

            {gameStatus === 'gameover' && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ backgroundColor: 'rgba(15, 15, 26, 0.95)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
                  {gameResult}
                </div>
                <div className="text-2xl mb-4" style={{ color: NEON_COLORS.gold }}>
                  移动步数: {moveCount}
                </div>
                <div className="text-lg mb-8" style={{ color: NEON_COLORS.neonBlue }}>
                  得分: {Math.max(0, 1000 - moveCount * 10)}
                </div>
                <div className="flex gap-4">
                  <motion.button
                    onClick={startGame}
                    className="px-6 py-3 rounded-lg font-bold"
                    style={{
                      backgroundColor: NEON_COLORS.neonPink,
                      color: NEON_COLORS.white,
                      boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    再来一局
                  </motion.button>
                  <motion.button
                    onClick={handleExit}
                    className="px-6 py-3 rounded-lg font-bold"
                    style={{
                      backgroundColor: NEON_COLORS.darkPurple,
                      color: NEON_COLORS.neonBlue,
                      border: `2px solid ${NEON_COLORS.neonBlue}`
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
        </motion.div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-center text-sm opacity-60" style={{ color: NEON_COLORS.gold }}>
          <div>
            <div className="font-semibold mb-1">游戏规则</div>
            <div>移动数字方块，按1-15顺序排列</div>
          </div>
          <div>
            <div className="font-semibold mb-1">获胜条件</div>
            <div>将所有数字按顺序排列成1-15</div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs opacity-40" style={{ color: NEON_COLORS.gold }}>
          提示：点击数字方块滑动到空白位置，步数越少得分越高！
        </div>
      </motion.div>
    </div>
  );
}
