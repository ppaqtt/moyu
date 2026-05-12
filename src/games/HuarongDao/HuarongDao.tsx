import { useState, useEffect, useCallback, useRef } from 'react';
import { HuarongDaoEngine, Piece } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

type GamePhase = 'menu' | 'playing' | 'win';

export default function HuarongDao() {
  const canvasSize = 500;
  const cellSize = canvasSize / 4;
  const [engine] = useState(() => new HuarongDaoEngine(cellSize));
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [moves, setMoves] = useState(0);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [hintPiece, setHintPiece] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const loadState = useCallback(() => {
    const state = engine.getState();
    setPieces(state.pieces);
    setMoves(state.moves);
  }, [engine]);

  const startGame = () => {
    engine.reset();
    loadState();
    setPhase('playing');
    setSelectedPiece(null);
    setShowHint(false);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (phase !== 'playing') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    // 找到点击位置下的块
    const clickedPiece = pieces.find(p => 
      x >= p.x && x < p.x + p.width &&
      y >= p.y && y < p.y + p.height
    );

    if (clickedPiece) {
      if (selectedPiece === clickedPiece.id) {
        // 再次点击同一个块，尝试移动
        const validMoves = engine.getValidMoves().filter(m => m.pieceId === clickedPiece.id);
        if (validMoves.length > 0) {
          const move = validMoves[0];
          if (engine.movePiece(move.pieceId, move.dx, move.dy)) {
            loadState();
            if (engine.isGameComplete()) {
              setPhase('win');
            }
          }
        }
        setSelectedPiece(null);
      } else {
        setSelectedPiece(clickedPiece.id);
      }
    } else if (selectedPiece !== null) {
      // 点击空白位置，尝试移动已选中的块
      const dx = x - Math.floor(pieces.find(p => p.id === selectedPiece)?.x || 0) - 1;
      const dy = y - Math.floor(pieces.find(p => p.id === selectedPiece)?.y || 0) - 1;
      
      // 简化处理：直接尝试四个方向
      const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 }
      ];

      for (const dir of directions) {
        if (engine.movePiece(selectedPiece, dir.dx, dir.dy)) {
          loadState();
          setSelectedPiece(null);
          if (engine.isGameComplete()) {
            setPhase('win');
          }
          return;
        }
      }
      setSelectedPiece(null);
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (phase !== 'playing' || selectedPiece === null) return;

    let dx = 0, dy = 0;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        dy = -1;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        dy = 1;
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        dx = -1;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        dx = 1;
        break;
      case 'Enter':
      case ' ':
        // 确认移动
        if (engine.movePiece(selectedPiece, dx, dy)) {
          loadState();
          if (engine.isGameComplete()) {
            setPhase('win');
          }
        }
        setSelectedPiece(null);
        return;
      default:
        return;
    }

    e.preventDefault();
    if (engine.movePiece(selectedPiece, dx, dy)) {
      loadState();
      if (engine.isGameComplete()) {
        setPhase('win');
      }
    }
    setSelectedPiece(null);
  }, [phase, selectedPiece, engine, loadState]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleHint = () => {
    const hint = engine.getHint();
    if (hint) {
      setHintPiece(hint.pieceId);
      setShowHint(true);
      setTimeout(() => {
        setShowHint(false);
        setHintPiece(null);
      }, 2000);
    }
  };

  const getPieceStyle = (piece: Piece) => {
    const isSelected = selectedPiece === piece.id;
    const isHinted = hintPiece === piece.id;

    let bgGradient: string;
    let shadow: string;
    let borderColor: string;

    switch (piece.type) {
      case 'cao':
        bgGradient = 'linear-gradient(135deg, #ff6b6b, #c92a2a)';
        shadow = '0 0 20px rgba(255, 107, 107, 0.6)';
        borderColor = '#ff6b6b';
        break;
      case 'zhang':
        bgGradient = 'linear-gradient(135deg, #4dabf7, #1971c2)';
        shadow = '0 0 15px rgba(77, 171, 247, 0.5)';
        borderColor = '#4dabf7';
        break;
      default:
        bgGradient = 'linear-gradient(135deg, #ffd43b, #fab005)';
        shadow = '0 0 10px rgba(255, 212, 59, 0.5)';
        borderColor = '#ffd43b';
    }

    if (isSelected) {
      shadow = '0 0 30px rgba(0, 255, 255, 0.8)';
      borderColor = NEON_COLORS.primary;
    }
    if (isHinted) {
      shadow = '0 0 25px rgba(255, 0, 255, 0.8)';
      borderColor = NEON_COLORS.secondary;
    }

    return {
      left: piece.x * cellSize,
      top: piece.y * cellSize,
      width: piece.width * cellSize - 4,
      height: piece.height * cellSize - 4,
      background: bgGradient,
      boxShadow: shadow,
      border: `3px solid ${borderColor}`,
      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
      zIndex: isSelected ? 10 : 1
    };
  };

  const getPieceLabel = (piece: Piece) => {
    switch (piece.type) {
      case 'cao':
        return '曹操';
      case 'zhang':
        return '将';
      default:
        return '';
    }
  };

  // 菜单界面
  if (phase === 'menu') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
           style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 bg-clip-text text-transparent">
            华容道
          </h1>
          <p className="text-gray-400 mb-8">Huarong Dao - 滑动块 Puzzle</p>

          <div className="glass-card rounded-2xl p-8 max-w-md mx-auto mb-8">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>1. 点击选择一个方块</li>
              <li>2. 使用方向键或WASD移动方块</li>
              <li>3. 将曹操移到底部中央位置</li>
              <li>4. 完成解谜挑战!</li>
            </ul>
            <div className="mt-6 flex justify-center gap-4">
              <div className="px-4 py-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #ff6b6b, #c92a2a)' }}>
                <span className="text-white font-bold">曹操</span>
              </div>
              <div className="px-4 py-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #4dabf7, #1971c2)' }}>
                <span className="text-white font-bold">大将</span>
              </div>
              <div className="px-4 py-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #ffd43b, #fab005)' }}>
                <span className="text-white font-bold">小兵</span>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
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

  // 胜利界面
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
          <p className="text-2xl text-gray-300 mb-2">你用了</p>
          <p className="text-6xl font-bold text-cyan-400 mb-8">{moves} 步</p>
          
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
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
      </div>
    );
  }

  // 游戏界面
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
         style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}>
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-4"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 bg-clip-text text-transparent">
          华容道
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
          <div className="text-sm text-gray-400">移动次数</div>
          <div className="text-2xl font-bold text-cyan-400">{moves}</div>
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

      {/* Game Canvas */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div
          ref={canvasRef}
          className="relative rounded-2xl overflow-hidden cursor-pointer"
          style={{
            width: canvasSize,
            height: canvasSize,
            background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)',
            border: `3px solid ${NEON_COLORS.primary}40`
          }}
          onClick={handleCanvasClick}
        >
          {/* Grid lines */}
          <div className="absolute inset-0 grid pointer-events-none"
               style={{ gridTemplateColumns: `repeat(4, ${cellSize}px)`, gridTemplateRows: `repeat(5, ${cellSize}px)` }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="border border-gray-700/30" />
            ))}
          </div>

          {/* Exit indicator at bottom */}
          <div 
            className="absolute bottom-0 left-1/4 w-1/2 h-1"
            style={{ 
              background: `linear-gradient(90deg, transparent, ${NEON_COLORS.success}, transparent)`,
              transform: 'translateY(100%)'
            }}
          />

          {/* Pieces */}
          <AnimatePresence>
            {pieces.map(piece => (
              <motion.div
                key={piece.id}
                layout
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="absolute rounded-xl flex items-center justify-center font-bold text-white select-none"
                style={getPieceStyle(piece)}
              >
                <span className="text-lg drop-shadow-lg">{getPieceLabel(piece)}</span>
              </motion.div>
            ))}
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
        <p>点击选择方块，使用方向键或WASD移动</p>
        <p className="text-cyan-400 mt-1">目标: 将曹操移到底部中央!</p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex gap-4 mt-6"
      >
        <button
          onClick={startGame}
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
