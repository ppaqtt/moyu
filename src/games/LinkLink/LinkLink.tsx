import { useState, useEffect, useRef } from 'react';
import { LinkLinkEngine } from './engine';
import { LINKLINK_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const ICONS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑', '🥭', '🍍',
               '🌸', '🌺', '🌻', '🌷', '🌹', '💐', '🍀', '🌿', '🌵', '🎄'];

export default function LinkLink() {
  const [engine] = useState(() => new LinkLinkEngine());
  const [board, setBoard] = useState(engine.getBoard());
  const [selectedTile, setSelectedTile] = useState<{ row: number; col: number } | null>(null);
  const [connectionLine, setConnectionLine] = useState<any[]>([]);
  const [message, setMessage] = useState('点击两个相同的图案进行消除');
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useLocalStorage(STORAGE_KEYS.LINKLINK, { highScore: 0 });
  const [currentScore, setCurrentScore] = useState(0);
  const [hintTiles, setHintTiles] = useState<{ row1: number; col1: number; row2: number; col2: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  const updateDisplay = () => {
    setBoard([...engine.getBoard()]);
    setSelectedTile(engine.getSelectedTile());
    setConnectionLine(engine.getConnectionLine());
    setCurrentScore(engine.getScore());
  };

  const handleTileClick = (row: number, col: number) => {
    if (gameState === 'idle') {
      setGameState('playing');
    }

    const result = engine.selectTile(row, col);
    setMessage(result.message);
    updateDisplay();

    if (engine.isGameOverState()) {
      setGameState('gameover');
      if (engine.getScore() > score.highScore) {
        setScore({ highScore: engine.getScore() });
      }
    }
  };

  const handleHint = () => {
    const hint = engine.getHint();
    if (hint) {
      setHintTiles(hint);
      setTimeout(() => setHintTiles(null), 2000);
    } else {
      setMessage('没有可用的提示');
    }
  };

  const handleShuffle = () => {
    engine.shuffle();
    updateDisplay();
    setMessage('洗牌完成');
  };

  const handleRestart = () => {
    engine.reset();
    updateDisplay();
    setGameState('idle');
    setCurrentScore(0);
    setMessage('点击两个相同的图案进行消除');
    setHintTiles(null);
  };

  // 绘制连接线
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (connectionLine.length > 0) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(connectionLine[0].x1, connectionLine[0].y1);
      ctx.lineTo(connectionLine[0].x2, connectionLine[0].y2);
      ctx.stroke();
      ctx.setLineDash([]);

      setTimeout(() => {
        setConnectionLine([]);
      }, 500);
    }
  }, [connectionLine]);

  const { TILE_WIDTH, TILE_HEIGHT, GRID_COLS, GRID_ROWS } = LINKLINK_CONSTANTS;
  const boardWidth = GRID_COLS * TILE_WIDTH;
  const boardHeight = GRID_ROWS * TILE_HEIGHT;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' }}>
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-6"
      >
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
          连连看 LinkLink
        </h1>
        <p className="text-gray-400">找到相同的图案，用线连接消除！</p>
      </motion.div>

      {/* Score Panel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-6 mb-4"
      >
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">当前分数</div>
          <div className="text-2xl font-bold text-yellow-400">{currentScore}</div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">最高记录</div>
          <div className="text-2xl font-bold text-cyan-400">{score.highScore}</div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">剩余</div>
          <div className="text-2xl font-bold text-purple-400">{engine.getRemainingTiles()}</div>
        </div>
      </motion.div>

      {/* Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-4"
      >
        <div className={`glass-card px-6 py-2 rounded-xl text-center ${
          message.includes('成功') ? 'text-green-400' :
          message.includes('无法') || message.includes('不匹配') ? 'text-red-400' :
          'text-gray-300'
        }`}>
          {message}
        </div>
      </motion.div>

      {/* Game Board */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative"
      >
        <div className="glass-card rounded-2xl p-4">
          <div className="relative">
            {/* Game Board Grid */}
            <div
              className="grid gap-1 p-2 rounded-xl"
              style={{
                width: boardWidth + 16,
                height: boardHeight + 16,
                background: 'rgba(0, 0, 0, 0.3)'
              }}
            >
              {board.map((row, rowIndex) =>
                row.map((tile, colIndex) => {
                  const isSelected = selectedTile?.row === rowIndex && selectedTile?.col === colIndex;
                  const isHinted = hintTiles &&
                    ((hintTiles.row1 === rowIndex && hintTiles.col1 === colIndex) ||
                     (hintTiles.row2 === rowIndex && hintTiles.col2 === colIndex));

                  return (
                    <motion.button
                      key={`${rowIndex}-${colIndex}`}
                      whileHover={!tile.matched ? { scale: 1.1 } : {}}
                      whileTap={!tile.matched ? { scale: 0.95 } : {}}
                      onClick={() => !tile.matched && handleTileClick(rowIndex, colIndex)}
                      disabled={tile.matched || gameState === 'gameover'}
                      className={`
                        flex items-center justify-center rounded-lg font-bold text-2xl
                        transition-all duration-200
                        ${tile.matched ? 'opacity-0' : 'cursor-pointer'}
                        ${isSelected ? 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-400/50' : ''}
                        ${isHinted ? 'ring-4 ring-green-400 animate-pulse' : ''}
                      `}
                      style={{
                        width: TILE_WIDTH - 4,
                        height: TILE_HEIGHT - 4,
                        background: isSelected
                          ? 'linear-gradient(135deg, #6c5ce7, #a855f7)'
                          : 'linear-gradient(135deg, #2d2d44, #3d3d5c)',
                        border: isHinted ? '2px solid #10b981' : '1px solid rgba(108, 92, 231, 0.3)'
                      }}
                    >
                      {ICONS[tile.type - 1]}
                    </motion.button>
                  );
                })
              )}
            </div>

            {/* Connection Canvas */}
            <canvas
              ref={canvasRef}
              width={boardWidth}
              height={boardHeight}
              className="absolute top-4 left-4 pointer-events-none"
              style={{
                marginLeft: '8px',
                marginTop: '8px'
              }}
            />
          </div>

          {/* Game Over Overlay */}
          {gameState === 'gameover' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <div className="text-4xl mb-4">🎉</div>
                <div className="text-3xl font-bold text-green-400 mb-2">恭喜通关！</div>
                <div className="text-xl text-yellow-400 mb-2">最终得分: {currentScore}</div>
                {currentScore >= score.highScore && currentScore > 0 && (
                  <div className="text-lg text-green-400 mb-4">🏆 新纪录！</div>
                )}
                <div className="text-gray-300 mb-4">
                  用时 {engine.getMoves()} 步，消除 {engine.getMatches()} 对
                </div>
                <button
                  onClick={handleRestart}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-cyan-600 rounded-xl text-white font-bold text-lg hover:from-green-700 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  再来一局
                </button>
              </motion.div>
            </div>
          )}
        </div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-between items-center mt-4 px-2"
        >
          <div className="flex gap-3">
            <button
              onClick={handleHint}
              disabled={gameState === 'gameover'}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
            >
              💡 提示
            </button>
            <button
              onClick={handleShuffle}
              disabled={gameState === 'gameover'}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
            >
              🔀 洗牌
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRestart}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
            >
              🔄 重新开始
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
            >
              🏠 返回主页
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 max-w-2xl text-center"
      >
        <div className="glass-card px-6 py-4 rounded-xl">
          <h3 className="text-lg font-semibold text-green-400 mb-2">🎯 游戏规则</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• 点击选中一个图案，再点击相同的图案即可消除</li>
            <li>• 两个图案之间必须能用最多两条直线连接</li>
            <li>• 图案可以连接到边界外的空位</li>
            <li>• 使用提示可以高亮一对可消除的图案</li>
            <li>• 洗牌会重新排列所有未消除的图案</li>
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
