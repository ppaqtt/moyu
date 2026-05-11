import { useState, useCallback, useEffect } from 'react';
import { HolidayJigsawEngine, PuzzlePiece } from './engine';
import { motion, AnimatePresence } from 'framer-motion';

type GamePhase = 'menu' | 'playing' | 'complete';

const DIFFICULTIES = [
  { grid: 3, label: '简单 (3x3)', pieces: 9 },
  { grid: 4, label: '中等 (4x4)', pieces: 16 },
  { grid: 5, label: '困难 (5x5)', pieces: 25 },
];

export default function HolidayJigsaw() {
  const [engine] = useState(() => new HolidayJigsawEngine());
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [selectedDifficulty, setSelectedDifficulty] = useState(0);
  const [selectedHoliday, setSelectedHoliday] = useState('spring');
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [gridSize, setGridSize] = useState(3);
  const [moves, setMoves] = useState(0);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);

  const holidays = engine.getHolidays();
  const currentHoliday = holidays.find(h => h.type === selectedHoliday) || holidays[0];

  const boardSize = 400;
  const cellSize = boardSize / gridSize;

  const startGame = useCallback((diffIndex: number, holidayType: string) => {
    const diff = DIFFICULTIES[diffIndex];
    engine.initialize(diff.grid, holidayType);
    setGridSize(diff.grid);
    setPieces([...engine.getState().pieces]);
    setMoves(0);
    setSelectedPiece(null);
    setPhase('playing');
  }, [engine]);

  const handlePieceClick = useCallback((pieceId: number) => {
    if (phase !== 'playing') return;

    if (selectedPiece !== null) {
      const piece = pieces.find(p => p.id === pieceId);
      if (piece) {
        const moved = engine.movePiece(selectedPiece, piece.currentX, piece.currentY);
        if (moved) {
          setPieces([...engine.getState().pieces]);
          setMoves(engine.getMoves());
          setSelectedPiece(null);

          if (engine.isComplete()) {
            setPhase('complete');
          }
        }
      }
    } else {
      setSelectedPiece(pieceId);
    }
  }, [phase, selectedPiece, engine, pieces]);

  const renderPuzzlePiece = (piece: PuzzlePiece) => {
    const isSelected = selectedPiece === piece.id;
    const isCorrect = piece.currentX === piece.correctX && piece.currentY === piece.correctY;
    
    return (
      <motion.div
        key={piece.id}
        layout
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`absolute flex items-center justify-center rounded-lg cursor-pointer transition-all ${isSelected ? 'z-20' : 'z-10'}`}
        style={{
          left: piece.currentX * cellSize + 2,
          top: piece.currentY * cellSize + 2,
          width: cellSize - 4,
          height: cellSize - 4,
          background: isCorrect 
            ? `linear-gradient(135deg, ${piece.color}40, ${piece.color}20)`
            : `linear-gradient(135deg, ${piece.color}30, ${piece.color}10)`,
          border: isSelected 
            ? `3px solid ${piece.color}` 
            : isCorrect 
              ? `2px solid ${piece.color}` 
              : `2px solid ${piece.color}50`,
          boxShadow: isSelected 
            ? `0 0 20px ${piece.color}` 
            : `0 4px 8px rgba(0,0,0,0.3)`,
        }}
        onClick={() => handlePieceClick(piece.id)}
      >
        <div className="text-4xl font-bold">
          {piece.emoji}
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
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            🧩 节日拼图 🧩
          </h1>
          <p className="text-gray-400 mb-8">选择节日主题，完成拼图！</p>

          <div className="glass-card rounded-2xl p-6 max-w-md mx-auto mb-6">
            <h3 className="text-lg font-bold text-cyan-400 mb-3">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>1. 点击选择拼图片</li>
              <li>2. 再点击另一块拼图交换位置</li>
              <li>3. 将所有拼图放到正确位置</li>
              <li>4. 完成拼图即可通关！</li>
            </ul>
          </div>

          <h3 className="text-lg font-bold text-gray-300 mb-3">选择节日</h3>
          <div className="flex gap-3 mb-6 justify-center flex-wrap">
            {holidays.map((holiday) => (
              <motion.button
                key={holiday.type}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedHoliday(holiday.type)}
                className={`px-4 py-2 rounded-xl font-bold transition-all ${
                  selectedHoliday === holiday.type ? 'text-white' : 'text-gray-400 bg-gray-800'
                }`}
                style={{
                  background: selectedHoliday === holiday.type 
                    ? `linear-gradient(135deg, ${holiday.colors[0]}, ${holiday.colors[1]})`
                    : undefined,
                  boxShadow: selectedHoliday === holiday.type 
                    ? `0 0 15px ${holiday.colors[0]}50`
                    : undefined,
                }}
              >
                {holiday.emojis[0]} {holiday.name}
              </motion.button>
            ))}
          </div>

          <h3 className="text-lg font-bold text-gray-300 mb-3">选择难度</h3>
          <div className="flex gap-3 mb-6 justify-center flex-wrap">
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
                    ? `linear-gradient(135deg, ${currentHoliday.colors[0]}, ${currentHoliday.colors[2]})`
                    : undefined,
                  boxShadow: selectedDifficulty === index 
                    ? `0 0 20px ${currentHoliday.colors[0]}50`
                    : undefined,
                }}
              >
                {diff.label}
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => startGame(selectedDifficulty, selectedHoliday)}
            className="px-12 py-4 text-xl font-bold rounded-2xl text-white"
            style={{ 
              background: `linear-gradient(135deg, ${currentHoliday.colors[0]}, ${currentHoliday.colors[1]})`,
              boxShadow: `0 0 30px ${currentHoliday.colors[0]}50`
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
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-6">🎉</div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
            拼图完成！
          </h1>
          <p className="text-2xl text-gray-300 mb-2">恭喜你完成了 {currentHoliday.name} 拼图！</p>
          
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
              onClick={() => startGame(selectedDifficulty, selectedHoliday)}
              className="px-8 py-3 text-xl font-bold rounded-xl text-white"
              style={{ 
                background: `linear-gradient(135deg, ${currentHoliday.colors[0]}, ${currentHoliday.colors[1]})`,
                boxShadow: `0 0 20px ${currentHoliday.colors[0]}50`
              }}
            >
              再玩一次
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPhase('menu')}
              className="px-8 py-3 text-xl font-bold rounded-xl text-white"
              style={{ 
                background: 'linear-gradient(135deg, #2d2d4e, #1a1a2e)',
                border: `2px solid ${currentHoliday.colors[0]}`
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
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-4"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
          🧩 节日拼图 - {currentHoliday.emojis[0]} {currentHoliday.name}
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
            border: `3px solid ${currentHoliday.colors[0]}50`
          }}
        >
          <AnimatePresence>
            {pieces.map((piece) => renderPuzzlePiece(piece))}
          </AnimatePresence>
          
          {selectedPiece !== null && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-cyan-400 text-sm animate-pulse">点击另一块拼图交换位置</div>
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
          <p className="text-cyan-400">点击另一块拼图交换位置</p>
        ) : (
          <p>点击选择拼图碎片</p>
        )}
      </motion.div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={() => startGame(selectedDifficulty, selectedHoliday)}
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
