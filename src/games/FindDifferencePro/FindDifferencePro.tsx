import { useState, useEffect, useCallback, useRef } from 'react';
import { FindDifferenceProEngine } from './engine';
import { FIND_DIFFERENCE_PRO_CONSTANTS, STORAGE_KEYS_FIND_DIFFERENCE_PRO } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export default function FindDifferencePro() {
  const [timeLeft, setTimeLeft] = useState(FIND_DIFFERENCE_PRO_CONSTANTS.TIME_LIMIT);
  const [engine] = useState(() => new FindDifferenceProEngine(setTimeLeft));
  const [gameState, setGameState] = useState({
    scene: engine.getScene(),
    differences: engine.getDifferences(),
    foundCount: engine.getFoundCount(),
    totalDifferences: engine.getTotalDifferences(),
    score: engine.getScore(),
    level: engine.getLevel(),
    gameOver: engine.isGameOver(),
    levelComplete: engine.isLevelComplete(),
  });
  const [foundPositions, setFoundPositions] = useState<{ x: number; y: number; type: string }[]>([]);
  const [wrongClick, setWrongClick] = useState<{ x: number; y: number } | null>(null);
  const [lastFoundType, setLastFoundType] = useState<string | null>(null);
  const [highScore, setHighScore] = useLocalStorage(STORAGE_KEYS_FIND_DIFFERENCE_PRO, { score: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const updateDisplay = useCallback(() => {
    setGameState({
      scene: engine.getScene(),
      differences: engine.getDifferences(),
      foundCount: engine.getFoundCount(),
      totalDifferences: engine.getTotalDifferences(),
      score: engine.getScore(),
      level: engine.getLevel(),
      gameOver: engine.isGameOver(),
      levelComplete: engine.isLevelComplete(),
    });
  }, [engine]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState.gameOver || gameState.levelComplete) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const result = engine.checkClick(x, y);

    if (result.found) {
      const type = engine.getDifferenceType(result.index);
      setLastFoundType(type);
      setFoundPositions(prev => [...prev, {
        x: gameState.differences[result.index].x,
        y: gameState.differences[result.index].y,
        type,
      }]);
      updateDisplay();
      
      setTimeout(() => setLastFoundType(null), 2000);
    } else {
      setWrongClick({ x, y });
      setTimeout(() => setWrongClick(null), 500);
    }
  }, [engine, updateDisplay, gameState]);

  const startGame = () => {
    engine.reset();
    engine.start();
    setFoundPositions([]);
    updateDisplay();
  };

  const handleNextLevel = () => {
    engine.nextLevel();
    setFoundPositions([]);
    engine.start();
    updateDisplay();
  };

  useEffect(() => {
    if (gameState.score > highScore.score) {
      setHighScore({ score: gameState.score });
    }
  }, [gameState.score, highScore.score, setHighScore]);

  useEffect(() => {
    return () => engine.stop();
  }, [engine]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getModifiedEmoji = (originalEmoji: string, rowIndex: number, colIndex: number): string => {
    const diff = gameState.differences.find(d => {
      const gridCols = 6;
      const gridRows = 6;
      const cellWidth = FIND_DIFFERENCE_PRO_CONSTANTS.CANVAS_WIDTH / gridCols;
      const cellHeight = FIND_DIFFERENCE_PRO_CONSTANTS.CANVAS_HEIGHT / gridRows;
      const diffCol = Math.floor(d.x / cellWidth);
      const diffRow = Math.floor(d.y / cellHeight);
      return diffCol === colIndex && diffRow === rowIndex && !d.found;
    });

    if (!diff) return originalEmoji;

    const allEmojis = gameState.scene.emojiGrid.flat();
    const otherEmojis = allEmojis.filter(e => e !== originalEmoji);
    const randomEmoji = otherEmojis[Math.floor(Math.random() * otherEmojis.length)] || originalEmoji;

    switch (diff.type) {
      case 'missing':
        return '';
      case 'shape':
      case 'color':
        return randomEmoji;
      default:
        return randomEmoji;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' }}>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-6"
      >
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          🔍 找茬大挑战 Pro
        </h1>
        <p className="text-gray-400">{gameState.scene.name}</p>
      </motion.div>

      <div className="flex gap-6 mb-4">
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">关卡</div>
          <div className="text-2xl font-bold text-purple-400">{gameState.level}</div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">已找到</div>
          <div className="text-2xl font-bold text-green-400">
            {gameState.foundCount} / {gameState.totalDifferences}
          </div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">剩余时间</div>
          <div className={`text-2xl font-bold ${
            timeLeft <= 15 ? 'text-red-500 animate-pulse' : 'text-cyan-400'
          }`}>
            {formatTime(timeLeft)}
          </div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">分数</div>
          <div className="text-2xl font-bold text-yellow-400">{gameState.score}</div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">最高分</div>
          <div className="text-2xl font-bold text-orange-400">{highScore.score}</div>
        </div>
      </div>

      <div className="mb-4 w-full max-w-4xl">
        <div className="glass-card px-4 py-2 rounded-xl">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>进度</span>
            <span>{Math.round((gameState.foundCount / gameState.totalDifferences) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${(gameState.foundCount / gameState.totalDifferences) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {lastFoundType && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="absolute top-1/4 z-50 glass-card px-8 py-4 rounded-xl"
          >
            <div className="text-green-400 font-bold text-xl">✓ 找到！{lastFoundType}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <div className="glass-card rounded-2xl p-4">
          <div className="flex gap-4">
            <div
              ref={canvasRef}
              className="relative cursor-crosshair rounded-xl overflow-hidden"
              style={{
                width: FIND_DIFFERENCE_PRO_CONSTANTS.CANVAS_WIDTH,
                height: FIND_DIFFERENCE_PRO_CONSTANTS.CANVAS_HEIGHT,
                background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)',
              }}
              onClick={handleCanvasClick}
            >
              <div className="grid h-full"
                   style={{
                     gridTemplateColumns: 'repeat(6, 1fr)',
                     gridTemplateRows: 'repeat(6, 1fr)',
                   }}>
                {gameState.scene.emojiGrid.flat().map((emoji, index) => (
                  <div key={`img1-${index}`} className="flex items-center justify-center text-3xl p-1">
                    {emoji}
                  </div>
                ))}
              </div>

              {foundPositions.map((pos, i) => (
                <motion.div
                  key={`found1-${i}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute border-4 border-green-500 rounded-full bg-green-500/20 flex items-center justify-center"
                  style={{
                    left: pos.x - 40,
                    top: pos.y - 40,
                    width: 80,
                    height: 80,
                    pointerEvents: 'none',
                  }}
                >
                  <span className="text-2xl">✓</span>
                </motion.div>
              ))}

              {wrongClick && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 1 }}
                  className="absolute border-4 border-red-500 rounded-full flex items-center justify-center"
                  style={{
                    left: wrongClick.x - 25,
                    top: wrongClick.y - 25,
                    width: 50,
                    height: 50,
                    pointerEvents: 'none',
                  }}
                >
                  <span className="text-xl">✗</span>
                </motion.div>
              )}
            </div>

            <div
              className="relative cursor-crosshair rounded-xl overflow-hidden"
              style={{
                width: FIND_DIFFERENCE_PRO_CONSTANTS.CANVAS_WIDTH,
                height: FIND_DIFFERENCE_PRO_CONSTANTS.CANVAS_HEIGHT,
                background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)',
              }}
              onClick={handleCanvasClick}
            >
              <div className="grid h-full"
                   style={{
                     gridTemplateColumns: 'repeat(6, 1fr)',
                     gridTemplateRows: 'repeat(6, 1fr)',
                   }}>
                {gameState.scene.emojiGrid.map((row, rowIndex) =>
                  row.map((emoji, colIndex) => (
                    <div key={`img2-${rowIndex}-${colIndex}`} className="flex items-center justify-center text-3xl p-1">
                      {getModifiedEmoji(emoji, rowIndex, colIndex)}
                    </div>
                  ))
                )}
              </div>

              {foundPositions.map((pos, i) => (
                <motion.div
                  key={`found2-${i}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute border-4 border-green-500 rounded-full bg-green-500/20 flex items-center justify-center"
                  style={{
                    left: pos.x - 40,
                    top: pos.y - 40,
                    width: 80,
                    height: 80,
                    pointerEvents: 'none',
                  }}
                >
                  <span className="text-2xl">✓</span>
                </motion.div>
              ))}

              {wrongClick && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 1 }}
                  className="absolute border-4 border-red-500 rounded-full flex items-center justify-center"
                  style={{
                    left: wrongClick.x - 25,
                    top: wrongClick.y - 25,
                    width: 50,
                    height: 50,
                    pointerEvents: 'none',
                  }}
                >
                  <span className="text-xl">✗</span>
                </motion.div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {(gameState.gameOver || gameState.levelComplete) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-2xl"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-center"
                >
                  {gameState.gameOver ? (
                    <>
                      <div className="text-5xl mb-4">⏰</div>
                      <div className="text-3xl font-bold text-red-500 mb-2">时间到！</div>
                      <div className="text-xl text-gray-300 mb-4">
                        找到 {gameState.foundCount} / {gameState.totalDifferences} 处不同
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-5xl mb-4">🎉</div>
                      <div className="text-3xl font-bold text-green-400 mb-2">恭喜过关！</div>
                      <div className="text-xl text-yellow-400 mb-4">
                        最终得分: {gameState.score}
                      </div>
                      {gameState.score > highScore.score && (
                        <div className="text-lg text-orange-400 mb-4">🏆 新纪录！</div>
                      )}
                    </>
                  )}
                  <div className="flex gap-3 justify-center mt-6">
                    {gameState.levelComplete && (
                      <button
                        onClick={handleNextLevel}
                        className="px-8 py-4 bg-gradient-to-r from-green-600 to-cyan-600 rounded-xl text-white font-bold hover:from-green-700 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-lg text-lg"
                      >
                        下一关 →
                      </button>
                    )}
                    <button
                      onClick={startGame}
                      className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg text-lg"
                    >
                      {gameState.levelComplete ? '重玩本关' : '再试一次'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-center items-center mt-4 gap-4">
          <button
            onClick={() => {
              startGame();
              engine.start();
            }}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
          >
            ▶️ 开始游戏
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
          >
            🏠 返回主页
          </button>
        </div>
      </div>

      <div className="mt-6 max-w-4xl w-full">
        <div className="glass-card px-6 py-4 rounded-xl">
          <h3 className="text-lg font-semibold text-pink-400 mb-3">🎯 游戏技巧</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-300 text-sm">
            <div>• 仔细对比两幅图片的每一个细节</div>
            <div>• 寻找不同类型的变化：颜色、形状、大小、位置、缺失</div>
            <div>• 每关有 {gameState.totalDifferences} 处不同</div>
            <div>• 尽快找到所有不同以获得时间奖励</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .glass-card {
          background: rgba(26, 26, 46, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(108, 92, 231, 0.3);
        }
      `}</style>
    </div>
  );
}
