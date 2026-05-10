import { useState, useCallback } from 'react';
import { PatternSlideEngine, Tile } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion } from 'framer-motion';

type GamePhase = 'menu' | 'playing' | 'complete';

const DIFFICULTIES = [
  { size: 3, label: '简单 (3x3)' },
  { size: 4, label: '中等 (4x4)' },
  { size: 5, label: '困难 (5x5)' },
];

export default function PatternSlide() {
  const [engine, setEngine] = useState(() => new PatternSlideEngine(4));
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState(1);
  const [gridSize, setGridSize] = useState(4);
  const [emptyPos, setEmptyPos] = useState({ row: 3, col: 3 });
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState('');

  const cellSize = 70;
  const boardSize = gridSize * cellSize;

  const loadState = useCallback(() => {
    const state = engine.getState();
    setTiles(state.tiles);
    setEmptyPos(state.emptyPos);
    setGridSize(state.gridSize);
    setMoves(state.moves);
  }, [engine]);

  const startGame = useCallback((difficultyIndex: number) => {
    const diff = DIFFICULTIES[difficultyIndex];
    const newEngine = new PatternSlideEngine(diff.size);
    setEngine(newEngine);
    const state = newEngine.getState();
    setTiles(state.tiles);
    setEmptyPos(state.emptyPos);
    setGridSize(state.gridSize);
    setMoves(0);
    setMessage('');
    setPhase('playing');
  }, []);

  const handleTileClick = useCallback((row: number, col: number) => {
    if (phase !== 'playing') return;

    const result = engine.move(row, col);
    setMessage(result.message);
    loadState();

    if (engine.isGameComplete()) {
      setTimeout(() => setPhase('complete'), 1000);
    }
  }, [phase, engine, loadState]);

  const getTileStyle = (tile: Tile) => {
    return {
      left: tile.col * cellSize,
      top: tile.row * cellSize,
      width: cellSize,
      height: cellSize
    };
  };

  const getTileColor = (imageIndex: number) => {
    const colors = [
      '#FF6B6B', '#FF8E72', '#FFA94D', '#FFD43B', '#A9E34B',
      '#69DB7C', '#38D9A9', '#66D9E8', '#74C0FC', '#9775FA',
      '#B197FC', '#F783AC', '#E599F7', '#FCC2D7', '#FF8787',
      '#FF922B', '#FFD8A8', '#8CE99A', '#63E6BE', '#66D9E8',
      '#74C0FC', '#B197FC', '#DA77F2', '#F783AC'
    ];
    return colors[imageIndex % colors.length];
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
            🖼️ 图案华容道
          </h1>
          <p className="text-gray-400 mb-8">Pattern Slide</p>

          <div className="glass-card rounded-2xl p-6 max-w-md mx-auto mb-6">
            <h3 className="text-lg font-bold text-cyan-400 mb-3">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>1. 点击滑块移动到空白位置</li>
              <li>2. 将图案排列成正确的顺序</li>
              <li>3. 按数字顺序排列即可完成</li>
              <li>4. 尽可能用最少的步数完成!</li>
            </ul>
          </div>

          <h3 className="text-lg font-bold text-gray-300 mb-4">选择难度</h3>
          <div className="flex gap-3 mb-8">
            {DIFFICULTIES.map((diff, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDifficulty(index)}
                className={`px-6 py-4 rounded-xl font-bold transition-all ${
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

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => startGame(selectedDifficulty)}
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
          <p className="text-2xl text-gray-300 mb-2">图案排列正确!</p>
          
          <div className="glass-card rounded-2xl p-6 max-w-sm mx-auto mb-8">
            <div className="text-sm text-gray-400">用时步数</div>
            <div className="text-5xl font-bold text-cyan-400 mb-2">{moves}</div>
            <div className="text-gray-400">
              难度: {gridSize}x{gridSize}
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startGame(selectedDifficulty)}
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
          🖼️ 图案华容道 - {gridSize}x{gridSize}
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-6 mb-4"
      >
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">步数</div>
          <div className="text-2xl font-bold text-cyan-400">{moves}</div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">难度</div>
          <div className="text-2xl font-bold text-purple-400">{gridSize}x{gridSize}</div>
        </div>
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card px-4 py-2 rounded-xl mb-4"
        >
          <span className="text-cyan-400">{message}</span>
        </motion.div>
      )}

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
            border: `3px solid ${NEON_COLORS.primary}40`,
            boxShadow: `0 0 30px ${NEON_COLORS.primary}30`
          }}
        >
          {tiles.map(tile => {
            const style = getTileStyle(tile);
            const color = getTileColor(tile.imageIndex);
            const isAdjacent = 
              (Math.abs(tile.row - emptyPos.row) === 1 && tile.col === emptyPos.col) ||
              (Math.abs(tile.col - emptyPos.col) === 1 && tile.row === emptyPos.row);

            return (
              <motion.div
                key={tile.id}
                whileHover={isAdjacent ? { scale: 1.05 } : {}}
                whileTap={isAdjacent ? { scale: 0.95 } : {}}
                className="absolute flex items-center justify-center rounded-lg cursor-pointer"
                style={{
                  ...style,
                  background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                  border: `2px solid ${color}80`,
                  boxShadow: `0 4px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)`,
                  opacity: 1,
                }}
                onClick={() => handleTileClick(tile.row, tile.col)}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-white drop-shadow-lg">
                    {tile.value}
                  </div>
                </div>
              </motion.div>
            );
          })}

          <div
            className="absolute rounded-lg"
            style={{
              left: emptyPos.col * cellSize,
              top: emptyPos.row * cellSize,
              width: cellSize,
              height: cellSize,
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px dashed rgba(108, 92, 231, 0.5)',
            }}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-4 text-center text-gray-400 text-sm"
      >
        <p>点击滑块移动到空白位置</p>
        <p className="text-cyan-400 mt-1">目标: 按1到{tiles.length}的顺序排列</p>
      </motion.div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={() => startGame(selectedDifficulty)}
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
