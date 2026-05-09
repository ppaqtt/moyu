import { useState, useEffect, useCallback } from 'react';
import { FindDiffEngine } from './engine';
import { FINDDIFF_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export default function FindDiff() {
  const [timeLeft, setTimeLeft] = useState(FINDDIFF_CONSTANTS.TIME_LIMIT);
  const [engine] = useState(() => new FindDiffEngine(setTimeLeft));
  const [gameState, setGameState] = useState({
    scene: engine.getScene(),
    differences: engine.getDifferences(),
    foundCount: engine.getFoundCount(),
    totalDifferences: engine.getTotalDifferences(),
    score: engine.getScore(),
    level: engine.getLevel(),
    gameOver: engine.isGameOver(),
    levelComplete: engine.isLevelComplete()
  });
  const [foundPositions, setFoundPositions] = useState<{ x: number; y: number }[]>([]);
  const [wrongClick, setWrongClick] = useState<{ x: number; y: number } | null>(null);
  const [score, setScore] = useLocalStorage(STORAGE_KEYS.FINDDIFF, { highScore: 0 });
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
      levelComplete: engine.isLevelComplete()
    });
  }, [engine]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState.gameOver || gameState.levelComplete) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const result = engine.checkClick(x, y);

    if (result.found) {
      setFoundPositions(prev => [...prev, {
        x: gameState.differences[result.index].x,
        y: gameState.differences[result.index].y
      }]);
      updateDisplay();
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
    return () => engine.stop();
  }, [engine]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' }}>
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-6"
      >
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          找不同 Find the Difference
        </h1>
        <p className="text-gray-400">找出两幅图中的不同之处！</p>
      </motion.div>

      {/* Info Panel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-6 mb-4"
      >
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
            timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-cyan-400'
          }`}>
            {formatTime(timeLeft)}
          </div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">分数</div>
          <div className="text-2xl font-bold text-yellow-400">{gameState.score}</div>
        </div>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-4 w-full max-w-4xl"
      >
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
      </motion.div>

      {/* Game Area */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative"
      >
        <div className="glass-card rounded-2xl p-4">
          {/* Two images side by side */}
          <div className="flex gap-4">
            {/* Image 1 */}
            <div
              className="relative cursor-crosshair rounded-xl overflow-hidden"
              style={{
                width: '400px',
                height: '600px',
                background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)'
              }}
              onClick={handleCanvasClick}
            >
              <div className="grid grid-cols-4 grid-rows-4 h-full">
                {gameState.scene.layout.flat().map((emoji, i) => (
                  <div key={`img1-${i}`} className="flex items-center justify-center text-4xl p-1">
                    {emoji}
                  </div>
                ))}
              </div>

              {/* Found markers */}
              {foundPositions.map((pos, i) => (
                <motion.div
                  key={`found-${i}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute border-4 border-green-500 rounded-full bg-green-500/20"
                  style={{
                    left: pos.x - 30,
                    top: pos.y - 30,
                    width: 60,
                    height: 60,
                    pointerEvents: 'none'
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">
                    ✓
                  </div>
                </motion.div>
              ))}

              {/* Wrong click indicator */}
              {wrongClick && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute border-4 border-red-500 rounded-full"
                  style={{
                    left: wrongClick.x - 20,
                    top: wrongClick.y - 20,
                    width: 40,
                    height: 40,
                    pointerEvents: 'none'
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-xl">✗</div>
                </motion.div>
              )}
            </div>

            {/* Image 2 - with differences */}
            <div
              className="relative cursor-crosshair rounded-xl overflow-hidden"
              style={{
                width: '400px',
                height: '600px',
                background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)'
              }}
              onClick={handleCanvasClick}
            >
              <div className="grid grid-cols-4 grid-rows-4 h-full">
                {gameState.scene.layout.flat().map((emoji, i) => {
                  // 找到这个位置是否有不同之处
                  const diff = gameState.differences.find(d => {
                    const gridX = i % 4;
                    const gridY = Math.floor(i / 4);
                    const diffGridX = Math.floor((d.x - 1) / 200);
                    const diffGridY = Math.floor((d.y - 1) / 150);
                    return gridX === diffGridX && gridY === diffGridY;
                  });

                  // 如果这个emoji有不同之处，随机替换
                  if (diff && !diff.found && Math.random() > 0.7) {
                    const allEmojis = gameState.scene.emojis;
                    const otherEmojis = allEmojis.filter(e => e !== emoji);
                    const newEmoji = otherEmojis[Math.floor(Math.random() * otherEmojis.length)];
                    return (
                      <div key={`img2-${i}`} className="flex items-center justify-center text-4xl p-1">
                        {newEmoji}
                      </div>
                    );
                  }

                  return (
                    <div key={`img2-${i}`} className="flex items-center justify-center text-4xl p-1">
                      {emoji}
                    </div>
                  );
                })}
              </div>

              {/* Found markers */}
              {foundPositions.map((pos, i) => (
                <motion.div
                  key={`found2-${i}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute border-4 border-green-500 rounded-full bg-green-500/20"
                  style={{
                    left: pos.x - 30,
                    top: pos.y - 30,
                    width: 60,
                    height: 60,
                    pointerEvents: 'none'
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">
                    ✓
                  </div>
                </motion.div>
              ))}

              {/* Wrong click indicator */}
              {wrongClick && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute border-4 border-red-500 rounded-full"
                  style={{
                    left: wrongClick.x - 20,
                    top: wrongClick.y - 20,
                    width: 40,
                    height: 40,
                    pointerEvents: 'none'
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-xl">✗</div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Game Over Overlay */}
          {(gameState.gameOver || gameState.levelComplete) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-2xl">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                {gameState.gameOver ? (
                  <>
                    <div className="text-4xl mb-4">⏰</div>
                    <div className="text-3xl font-bold text-red-500 mb-2">时间到！</div>
                    <div className="text-xl text-gray-300 mb-2">
                      找到 {gameState.foundCount} / {gameState.totalDifferences} 处不同
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-4">🎉</div>
                    <div className="text-3xl font-bold text-green-400 mb-2">恭喜过关！</div>
                    <div className="text-xl text-yellow-400 mb-2">
                      最终得分: {gameState.score}
                    </div>
                    {gameState.score > score.highScore && (
                      <div className="text-lg text-green-400 mb-4">🏆 新纪录！</div>
                    )}
                  </>
                )}
                <div className="flex gap-3 justify-center mt-4">
                  {gameState.levelComplete && (
                    <button
                      onClick={handleNextLevel}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-cyan-600 rounded-xl text-white font-bold hover:from-green-700 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-lg"
                    >
                      下一关 →
                    </button>
                  )}
                  <button
                    onClick={startGame}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
                  >
                    {gameState.levelComplete ? '重玩本关' : '再试一次'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center items-center mt-4"
        >
          <button
            onClick={() => {
              startGame();
              engine.start();
            }}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors mr-4"
          >
            ▶️ 开始游戏
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
          >
            🏠 返回主页
          </button>
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
          <h3 className="text-lg font-semibold text-pink-400 mb-2">🎯 游戏技巧</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• 点击两幅图的相同位置找出不同之处</li>
            <li>• 每关有 {gameState.totalDifferences} 处不同</li>
            <li>• 在限定时间内找出所有不同即可过关</li>
            <li>• 剩余时间越多，获得的分数越高</li>
            <li>• 仔细观察图案的位置、颜色和数量变化</li>
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
