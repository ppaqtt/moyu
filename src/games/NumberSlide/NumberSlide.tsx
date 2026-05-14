import { useState, useEffect, useCallback, useRef } from 'react';
import { NumberSlideEngine } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

type GamePhase = 'menu' | 'playing' | 'win';

const SIZES = [
  { value: 3, label: '3x3', subtitle: '简单' },
  { value: 4, label: '4x4', subtitle: '中等' },
  { value: 5, label: '5x5', subtitle: '困难' }
];

export default function NumberSlide() {
  const canvasSize = 400;
  const [selectedSize, setSelectedSize] = useState(4);
  const [engine, setEngine] = useState(() => new NumberSlideEngine(selectedSize));
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [board, setBoard] = useState<number[][]>([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [hintCell, setHintCell] = useState<{ row: number; col: number } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const cellSize = canvasSize / selectedSize;

  const loadState = useCallback(() => {
    const state = engine.getState();
    setBoard(state.board);
    setMoves(state.moves);
  }, [engine]);

  const startGame = (size: number) => {
    const newEngine = new NumberSlideEngine(size);
    setEngine(newEngine);
    const state = newEngine.getState();
    setBoard(state.board);
    setMoves(0);
    setTime(0);
    setPhase('playing');
    setShowHint(false);
    setHintCell(null);

    // 开始计时
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = window.setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
  };

  const handleWin = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPhase('win');
  }, []);

  const handleTileClick = (row: number, col: number) => {
    if (phase !== 'playing') return;
    
    if (engine.moveTile(row, col)) {
      loadState();
      if (engine.isGameComplete()) {
        handleWin();
      }
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (phase !== 'playing') return;

    let direction: 'up' | 'down' | 'left' | 'right' | null = null;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        direction = 'up';
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        direction = 'down';
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        direction = 'left';
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        direction = 'right';
        break;
      default:
        return;
    }

    e.preventDefault();
    if (direction && engine.move(direction)) {
      loadState();
      if (engine.isGameComplete()) {
        handleWin();
      }
    }
  }, [phase, engine, loadState, handleWin]);

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || phase !== 'playing') return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const threshold = cellSize / 3;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > threshold) {
        engine.move('right');
      } else if (dx < -threshold) {
        engine.move('left');
      }
    } else {
      if (dy > threshold) {
        engine.move('down');
      } else if (dy < -threshold) {
        engine.move('up');
      }
    }

    loadState();
    if (engine.isGameComplete()) {
      handleWin();
    }

    touchStartRef.current = null;
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleHint = () => {
    const hint = engine.getHint();
    if (hint) {
      setHintCell(hint);
      setShowHint(true);
      setTimeout(() => {
        setShowHint(false);
        setHintCell(null);
      }, 1500);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTileColor = (num: number) => {
    if (num === 0) return 'transparent';
    const hue = ((num - 1) / (selectedSize * selectedSize - 1)) * 60 + 200; // Cyan to purple
    return `hsl(${hue}, 70%, 50%)`;
  };

  const getTileStyle = (num: number, row: number, col: number) => {
    const isHinted = hintCell?.row === row && hintCell?.col === col;
    const isAdjacent = engine.isAdjacent(row, col);
    
    return {
      width: cellSize - 4,
      height: cellSize - 4,
      background: num === 0 ? 'transparent' : `linear-gradient(135deg, ${getTileColor(num)}, ${getTileColor(num)}dd)`,
      boxShadow: isHinted 
        ? `0 0 20px ${NEON_COLORS.secondary}` 
        : isAdjacent && num !== 0
          ? `0 0 10px ${getTileColor(num)}80`
          : `0 4px 8px rgba(0, 0, 0, 0.3)`,
      border: isHinted 
        ? `3px solid ${NEON_COLORS.secondary}` 
        : num === 0 
          ? 'none' 
          : `2px solid ${getTileColor(num)}dd`,
      cursor: isAdjacent || num === 0 ? 'pointer' : 'default',
      opacity: num === 0 ? 0 : 1
    };
  };

  // Menu Screen
  if (phase === 'menu') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
           style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            数字华容道
          </h1>
          <p className="text-gray-400 mb-8">Number Slide Puzzle</p>

          <div className="glass-card rounded-2xl p-8 max-w-md mx-auto mb-8">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>1. 滑动数字方块使它们按顺序排列</li>
              <li>2. 点击相邻空位的方块来移动</li>
              <li>3. 支持键盘方向键和WASD</li>
              <li>4. 支持滑动手势操作</li>
            </ul>
            <p className="mt-4 text-yellow-400">目标: 将数字 1-{selectedSize * selectedSize - 1} 按顺序排列!</p>
          </div>

          <h3 className="text-lg font-bold text-gray-300 mb-4">选择难度</h3>
          <div className="flex gap-4 justify-center mb-8">
            {SIZES.map(size => (
              <motion.button
                key={size.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedSize(size.value)}
                className={`px-6 py-4 rounded-xl font-bold transition-all ${
                  selectedSize === size.value 
                    ? 'text-white' 
                    : 'text-gray-400 bg-gray-800 hover:bg-gray-700'
                }`}
                style={{
                  background: selectedSize === size.value 
                    ? `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`
                    : undefined,
                  boxShadow: selectedSize === size.value 
                    ? `0 0 20px ${NEON_COLORS.primary}50` 
                    : undefined
                }}
              >
                <div className="text-2xl">{size.label}</div>
                <div className="text-sm opacity-75">{size.subtitle}</div>
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => startGame(selectedSize)}
            className="px-12 py-4 text-xl font-bold rounded-2xl text-white"
            style={{ 
              background: `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
              boxShadow: `0 0 30px ${NEON_COLORS.primary}50`
            }}
          >
            开始游戏
          </motion.button>
        </motion.div>

        <style>{`
          .glass-card {
            background: rgba(26, 26, 46, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(108, 92, 231, 0.3);
          }
        `}</style>
      </div>
    );
  }

  // Win Screen
  if (phase === 'win') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
           style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-6">🎉</div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
            恭喜通关!
          </h1>
          
          <div className="glass-card rounded-2xl p-6 max-w-sm mx-auto mb-8">
            <div className="flex justify-between mb-4">
              <div>
                <div className="text-sm text-gray-400">用时</div>
                <div className="text-3xl font-bold text-cyan-400">{formatTime(time)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">步数</div>
                <div className="text-3xl font-bold text-pink-400">{moves}</div>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              难度: {SIZES.find(s => s.value === selectedSize)?.label} {SIZES.find(s => s.value === selectedSize)?.subtitle}
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startGame(selectedSize)}
              className="px-8 py-3 text-lg font-bold rounded-xl text-white"
              style={{ 
                background: `linear-gradient(135deg, ${NEON_COLORS.success}, #00aa00)`,
                boxShadow: `0 0 20px ${NEON_COLORS.success}50`
              }}
            >
              再玩一次
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPhase('menu')}
              className="px-8 py-3 text-lg font-bold rounded-xl text-white"
              style={{ 
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}, #2a2a4e)`,
                border: `2px solid ${NEON_COLORS.primary}`
              }}
            >
              返回菜单
            </motion.button>
          </div>
        </motion.div>

        <style>{`
          .glass-card {
            background: rgba(26, 26, 46, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(108, 92, 231, 0.3);
          }
        `}</style>
      </div>
    );
  }

  // Game Screen
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
         style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}>
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-4"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          数字华容道
        </h1>
      </motion.div>

      {/* HUD */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-6 mb-4"
      >
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">用时</div>
          <div className="text-2xl font-bold text-cyan-400">{formatTime(time)}</div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">步数</div>
          <div className="text-2xl font-bold text-pink-400">{moves}</div>
        </div>
        <button
          onClick={handleHint}
          className="glass-card px-6 py-3 rounded-xl hover:border-pink-500 transition-colors cursor-pointer"
          style={{ border: '1px solid rgba(255, 0, 255, 0.3)' }}
        >
          <div className="text-sm text-gray-400">提示</div>
          <div className="text-2xl font-bold text-pink-400">💡</div>
        </button>
      </motion.div>

      {/* Game Board */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div
          ref={canvasRef}
          className="relative rounded-2xl overflow-hidden"
          style={{
            width: canvasSize,
            height: canvasSize,
            background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)',
            border: `3px solid ${NEON_COLORS.primary}40`
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence>
            {board.map((row, rowIndex) =>
              row.map((num, colIndex) => (
                <motion.div
                  key={`${rowIndex}-${colIndex}-${num}`}
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: num === 0 ? 0 : 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="absolute rounded-xl flex items-center justify-center font-bold text-white select-none"
                  style={{
                    left: colIndex * cellSize + 2,
                    top: rowIndex * cellSize + 2,
                    ...getTileStyle(num, rowIndex, colIndex)
                  }}
                  onClick={() => handleTileClick(rowIndex, colIndex)}
                >
                  {num !== 0 && (
                    <span className="text-2xl drop-shadow-lg">{num}</span>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 text-center text-gray-400 text-sm"
      >
        <p>点击相邻空位的方块，或使用方向键/WASD移动</p>
        <p className="text-cyan-400 mt-1">目标: 按顺序排列 1-{selectedSize * selectedSize - 1}</p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex gap-4 mt-6"
      >
        <button
          onClick={() => startGame(selectedSize)}
          className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-white font-bold hover:from-red-700 hover:to-orange-700 transition-all"
        >
          🔄 重新开始
        </button>
        <button
          onClick={() => setPhase('menu')}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-colors"
        >
          🏠 返回菜单
        </button>
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
