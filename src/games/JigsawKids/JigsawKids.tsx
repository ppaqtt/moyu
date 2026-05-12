import { useState, useCallback, useEffect } from 'react';
import { JigsawKidsEngine, PuzzlePiece } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';

type GamePhase = 'menu' | 'playing' | 'complete';

const DIFFICULTIES = [
  { grid: 3, label: '简单 (3x3)', pieces: 9 },
  { grid: 4, label: '中等 (4x4)', pieces: 16 },
  { grid: 5, label: '困难 (5x5)', pieces: 25 },
];

export default function JigsawKids() {
  const [engine] = useState(() => new JigsawKidsEngine());
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [selectedDifficulty, setSelectedDifficulty] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [gridSize, setGridSize] = useState(3);
  const [moves, setMoves] = useState(0);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [imageData, setImageData] = useState<{ name: string; emoji: string; colors: string[] } | null>(null);

  const boardSize = 400;
  const cellSize = boardSize / gridSize;

  const startGame = useCallback((diffIndex: number, imgIndex: number) => {
    const diff = DIFFICULTIES[diffIndex];
    engine.initialize(diff.grid, imgIndex);
    setGridSize(diff.grid);
    setPieces([...engine.getState().pieces]);
    setMoves(0);
    setSelectedPiece(null);
    setImageData(engine.getImageData(imgIndex));
    setPhase('playing');
  }, [engine]);

  const handleCellClick = useCallback((x: number, y: number) => {
    if (phase !== 'playing') return;

    if (selectedPiece !== null) {
      const moved = engine.movePiece(selectedPiece, x, y);
      if (moved) {
        setPieces([...engine.getState().pieces]);
        setMoves(engine.getMoves());
        setSelectedPiece(null);

        if (engine.isComplete()) {
          setPhase('complete');
        }
      }
    } else {
      const piece = pieces.find(p => p.currentX === x && p.currentY === y);
      if (piece) {
        setSelectedPiece(piece.id);
      }
    }
  }, [phase, selectedPiece, engine, pieces]);

  const getPieceAt = (x: number, y: number): PuzzlePiece | undefined => {
    return pieces.find(p => p.currentX === x && p.currentY === y);
  };

  const renderPuzzlePiece = (piece: PuzzlePiece, index: number) => {
    const isSelected = selectedPiece === piece.id;
    const isCorrect = piece.currentX === piece.correctX && piece.currentY === piece.correctY;
    
    return (
      <motion.div
        key={piece.id}
        layout
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="absolute flex items-center justify-center rounded-lg cursor-pointer transition-all"
        style={{
          left: piece.currentX * cellSize + 2,
          top: piece.currentY * cellSize + 2,
          width: cellSize - 4,
          height: cellSize - 4,
          background: isCorrect 
            ? `linear-gradient(135deg, ${NEON_COLORS.success}40, ${NEON_COLORS.success}20)`
            : `linear-gradient(135deg, ${NEON_COLORS.primary}40, ${NEON_COLORS.secondary}40)`,
          border: isSelected 
            ? `3px solid ${NEON_COLORS.warning}` 
            : isCorrect 
              ? `2px solid ${NEON_COLORS.success}` 
              : `2px solid ${NEON_COLORS.primary}50`,
          boxShadow: isSelected 
            ? `0 0 20px ${NEON_COLORS.warning}` 
            : `0 4px 8px rgba(0,0,0,0.3)`,
          zIndex: isSelected ? 10 : 1,
        }}
        onClick={() => {
          if (selectedPiece === piece.id) {
            setSelectedPiece(null);
          } else if (selectedPiece === null) {
            setSelectedPiece(piece.id);
          }
        }}
      >
        <div 
          className="text-4xl font-bold"
          style={{
            background: imageData 
              ? `linear-gradient(135deg, ${imageData.colors[piece.correctX % imageData.colors.length]}, ${imageData.colors[(piece.correctY + piece.correctX) % imageData.colors.length]})`
              : NEON_COLORS.primary,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {imageData?.emoji || '🧩'}
        </div>
        <div className="absolute bottom-1 right-1 text-xs text-gray-400">
          {piece.correctX + 1},{piece.correctY + 1}
        </div>
      </motion.div>
    );
  };

  if (phase === 'menu') {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            🧩 拼图乐园
          </h1>
          <p className="text-gray-400 mb-8">Jigsaw Kids</p>

          <div className="glass-card rounded-2xl p-6 max-w-md mx-auto mb-6">
            <h3 className="text-lg font-bold text-cyan-400 mb-3">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>1. 点击选择拼图片</li>
              <li>2. 再点击空白位置移动</li>
              <li>3. 将所有拼图放到正确位置</li>
              <li>4. 完成拼图即可通关!</li>
            </ul>
          </div>

          <h3 className="text-lg font-bold text-gray-300 mb-3">选择难度</h3>
          <div className="flex gap-3 mb-6">
            {DIFFICULTIES.map((diff, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDifficulty(index)}
                className={`px-4 py-3 rounded-xl font-bold transition-all ${
                  selectedDifficulty === index ? 'text-white' : 'text-gray-400 bg-gray-800'
                }`}
                style={{
                  background: selectedDifficulty === index 
                    ? `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`
                    : undefined,
                  boxShadow: selectedDifficulty === index 
                    ? `0 0 20px ${NEON_COLORS.primary}50` 
                    : undefined,
                }}
              >
                {diff.label}
              </motion.button>
            ))}
          </div>

          <h3 className="text-lg font-bold text-gray-300 mb-3">选择图案</h3>
          <div className="flex gap-3 mb-8 justify-center">
            {[0, 1, 2, 3, 4].map((index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedImage(index)}
                className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all ${
                  selectedImage === index ? 'ring-2 ring-white' : 'opacity-70'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${NEON_COLORS.primary}40, ${NEON_COLORS.secondary}40)`,
                }}
              >
                {engine.getImages()[index]}
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => startGame(selectedDifficulty, selectedImage)}
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

  if (phase === 'complete') {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-6">🎉</div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
            拼图完成!
          </h1>
          <p className="text-2xl text-gray-300 mb-2">恭喜你完成了拼图!</p>
          
          <div className="glass-card rounded-2xl p-6 max-w-sm mx-auto mb-8">
            <div className="flex justify-between mb-4">
              <div>
                <div className="text-sm text-gray-400">移动次数</div>
                <div className="text-3xl font-bold text-cyan-400">{moves}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">拼图难度</div>
                <div className="text-3xl font-bold text-purple-400">{gridSize}x{gridSize}</div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startGame(selectedDifficulty, selectedImage)}
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

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-4"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
          🧩 拼图乐园 - {imageData?.emoji} {imageData?.name}
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-6 mb-4"
      >
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">移动次数</div>
          <div className="text-2xl font-bold text-cyan-400">{moves}</div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">拼图大小</div>
          <div className="text-2xl font-bold text-purple-400">{gridSize}x{gridSize}</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            width: boardSize,
            height: boardSize,
            background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)',
            border: `3px solid ${NEON_COLORS.primary}40`
          }}
        >
          {pieces.map((piece, index) => renderPuzzlePiece(piece, index))}
          
          {selectedPiece === null && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-gray-500 text-sm">点击选择拼图</div>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-4 text-center text-gray-400 text-sm"
      >
        {selectedPiece !== null ? (
          <p className="text-cyan-400">点击空白位置放置拼图</p>
        ) : (
          <p>点击选择拼图碎片</p>
        )}
      </motion.div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={() => startGame(selectedDifficulty, selectedImage)}
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
      </div>

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
