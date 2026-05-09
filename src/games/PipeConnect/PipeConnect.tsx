import { useState, useEffect, useCallback } from 'react';
import { PipeConnectEngine, PipeType } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

type GamePhase = 'menu' | 'playing' | 'win';

const SIZES = [
  { value: 4, label: '4x4', subtitle: '简单' },
  { value: 5, label: '5x5', subtitle: '中等' },
  { value: 6, label: '6x6', subtitle: '困难' },
  { value: 7, label: '7x7', subtitle: '专家' }
];

export default function PipeConnect() {
  const canvasSize = 500;
  const [selectedSize, setSelectedSize] = useState(5);
  const [engine, setEngine] = useState(() => new PipeConnectEngine(selectedSize));
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [grid, setGrid] = useState<any[][]>([]);
  const [moves, setMoves] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [startPos, setStartPos] = useState({ row: 0, col: 0 });
  const [endPos, setEndPos] = useState({ row: 4, col: 4 });
  const [hintCell, setHintCell] = useState<{ row: number; col: number } | null>(null);
  const [showHint, setShowHint] = useState(false);

  const cellSize = canvasSize / selectedSize;

  const loadState = useCallback(() => {
    const state = engine.getState();
    setGrid(state.grid);
    setMoves(state.moves);
    setIsComplete(state.isComplete);
    setStartPos(state.startPos);
    setEndPos(state.endPos);
  }, [engine]);

  const startGame = (size: number) => {
    const newEngine = new PipeConnectEngine(size);
    setEngine(newEngine);
    const state = newEngine.getState();
    setGrid(state.grid);
    setMoves(0);
    setIsComplete(false);
    setStartPos(state.startPos);
    setEndPos(state.endPos);
    setPhase('playing');
    setShowHint(false);
    setHintCell(null);
  };

  const handleCellClick = (row: number, col: number) => {
    if (phase !== 'playing') return;
    if (grid[row][col].isFixed) return;

    engine.rotatePipe(row, col);
    loadState();
  };

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

  const renderPipe = (pipeType: PipeType, rotation: number, hasWater: boolean, isStart: boolean, isEnd: boolean) => {
    const waterColor = isStart ? '#00ff88' : isEnd ? '#ff6b6b' : '#00bfff';
    const pipeColor = hasWater ? waterColor : '#666';
    const glowIntensity = hasWater ? '0 0 15px' : 'none';

    const style: React.CSSProperties = {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease'
    };

    const pipeStyle: React.CSSProperties = {
      width: '70%',
      height: '70%',
      background: pipeColor,
      borderRadius: pipeType.includes('straight') ? '4px' : '50%',
      boxShadow: `${glowIntensity} ${pipeColor}`,
      transform: `rotate(${rotation}deg)`,
      transition: 'transform 0.2s ease'
    };

    switch (pipeType) {
      case 'straight_h':
        return (
          <div style={style}>
            <div style={{ ...pipeStyle, width: '100%', height: '35%' }} />
          </div>
        );
      case 'straight_v':
        return (
          <div style={style}>
            <div style={{ ...pipeStyle, width: '35%', height: '100%' }} />
          </div>
        );
      case 'corner_tl':
      case 'corner_tr':
      case 'corner_bl':
      case 'corner_br':
        return (
          <div style={style}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
              <path
                d="M 30 50 L 50 50 L 50 30 L 70 30"
                fill="none"
                stroke={pipeColor}
                strokeWidth="20"
                strokeLinecap="round"
                style={{ filter: hasWater ? `drop-shadow(0 0 8px ${pipeColor})` : 'none' }}
                transform={`rotate(${rotation}, 50, 50)`}
              />
            </svg>
          </div>
        );
      case 'cross':
        return (
          <div style={style}>
            <div style={{ ...pipeStyle, width: '100%', height: '35%' }} />
            <div style={{ ...pipeStyle, width: '35%', height: '100%', position: 'absolute' }} />
          </div>
        );
      case 'tee_l':
      case 'tee_r':
      case 'tee_t':
      case 'tee_b':
        return (
          <div style={style}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
              <path
                d="M 0 50 L 100 50 M 50 50 L 50 0"
                fill="none"
                stroke={pipeColor}
                strokeWidth="20"
                strokeLinecap="round"
                style={{ filter: hasWater ? `drop-shadow(0 0 8px ${pipeColor})` : 'none' }}
                transform={`rotate(${rotation}, 50, 50)`}
              />
            </svg>
          </div>
        );
      case 'start':
        return (
          <div style={style}>
            <div style={{
              width: '50%',
              height: '50%',
              background: 'linear-gradient(135deg, #00ff88, #00cc66)',
              borderRadius: '50%',
              boxShadow: `0 0 20px #00ff88`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '10px', color: 'white' }}>入</span>
            </div>
          </div>
        );
      case 'end':
        return (
          <div style={style}>
            <div style={{
              width: '50%',
              height: '50%',
              background: 'linear-gradient(135deg, #ff6b6b, #cc4444)',
              borderRadius: '50%',
              boxShadow: `0 0 20px #ff6b6b`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '10px', color: 'white' }}>出</span>
            </div>
          </div>
        );
      default:
        return <div style={pipeStyle} />;
    }
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
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            水管连接
          </h1>
          <p className="text-gray-400 mb-8">Pipe Connect Puzzle</p>

          <div className="glass-card rounded-2xl p-8 max-w-md mx-auto mb-8">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>1. 点击管道将其旋转90度</li>
              <li>2. 连接起点(绿色)到终点(红色)</li>
              <li>3. 水会从起点流向连通的管道</li>
              <li>4. 让水流到达终点即可通关!</li>
            </ul>
            <div className="mt-6 flex justify-center gap-6">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-green-500 mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-xs">入</span>
                </div>
                <span className="text-xs text-gray-400">起点</span>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-red-500 mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-xs">出</span>
                </div>
                <span className="text-xs text-gray-400">终点</span>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-300 mb-4">选择难度</h3>
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {SIZES.map(size => (
              <motion.button
                key={size.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedSize(size.value)}
                className={`px-5 py-3 rounded-xl font-bold transition-all ${
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
                <div className="text-xl">{size.label}</div>
                <div className="text-xs opacity-75">{size.subtitle}</div>
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
  if (phase === 'win' || isComplete) {
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
            连接成功!
          </h1>
          <p className="text-2xl text-gray-300 mb-2">水流通畅!</p>
          <p className="text-3xl font-bold text-cyan-400 mb-8">用了 {moves} 次旋转</p>
          
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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
          水管连接
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
          <div className="text-sm text-gray-400">旋转次数</div>
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

      {/* Game Board */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            width: canvasSize,
            height: canvasSize,
            background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)',
            border: `3px solid ${NEON_COLORS.primary}40`
          }}
        >
          {/* Grid */}
          <div 
            className="absolute inset-0 grid"
            style={{ gridTemplateColumns: `repeat(${selectedSize}, 1fr)`, gridTemplateRows: `repeat(${selectedSize}, 1fr)` }}
          >
            {Array.from({ length: selectedSize * selectedSize }).map((_, i) => (
              <div key={i} className="border border-gray-700/30" />
            ))}
          </div>

          {/* Pipes */}
          <AnimatePresence>
            {grid.map((row: any[], rowIndex: number) =>
              row.map((cell: any, colIndex: number) => {
                const isHinted = hintCell?.row === rowIndex && hintCell?.col === colIndex;
                const isStart = startPos.row === rowIndex && startPos.col === colIndex;
                const isEnd = endPos.row === rowIndex && endPos.col === colIndex;

                return (
                  <motion.div
                    key={`${rowIndex}-${colIndex}`}
                    layout
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute flex items-center justify-center cursor-pointer"
                    style={{
                      left: colIndex * cellSize,
                      top: rowIndex * cellSize,
                      width: cellSize,
                      height: cellSize,
                      background: isHinted ? `${NEON_COLORS.secondary}40` : 'transparent',
                      border: isHinted ? `2px solid ${NEON_COLORS.secondary}` : 'none',
                      borderRadius: '4px'
                    }}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {renderPipe(
                      cell.pipeType, 
                      cell.rotation, 
                      cell.hasWater,
                      isStart,
                      isEnd
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>

          {/* Water animation overlay */}
          {grid.some((row: any[]) => row.some((cell: any) => cell.hasWater)) && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {grid.map((row: any[], rowIndex: number) =>
                row.map((cell: any, colIndex: number) => 
                  cell.hasWater && (
                    <motion.div
                      key={`water-${rowIndex}-${colIndex}`}
                      className="absolute rounded-full"
                      style={{
                        left: colIndex * cellSize + cellSize / 2,
                        top: rowIndex * cellSize + cellSize / 2,
                        width: '8px',
                        height: '8px',
                        background: cell.pipeType === 'start' ? '#00ff88' : 
                                   cell.pipeType === 'end' ? '#ff6b6b' : '#00bfff',
                        boxShadow: `0 0 10px ${cell.pipeType === 'start' ? '#00ff88' : 
                                                    cell.pipeType === 'end' ? '#ff6b6b' : '#00bfff'}`
                      }}
                      animate={{
                        opacity: [1, 0.3, 1],
                        scale: [1, 1.5, 1]
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )
                )
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 text-center text-gray-400 text-sm"
      >
        <p>点击管道旋转90度，连接起点到终点</p>
        <p className="text-cyan-400 mt-1">蓝色发光表示水流通畅!</p>
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
