import { useState, useEffect, useCallback, useRef } from 'react';
import { HiddenPictureEngine } from './engine';
import { HIDDEN_PICTURE_CONSTANTS, STORAGE_KEYS_HIDDEN_PICTURE } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export default function HiddenPicture() {
  const [timeLeft, setTimeLeft] = useState(HIDDEN_PICTURE_CONSTANTS.TIME_LIMIT);
  const [engine] = useState(() => new HiddenPictureEngine(setTimeLeft));
  const [gameState, setGameState] = useState({
    levelConfig: engine.getLevelConfig(),
    items: engine.getItems(),
    foundCount: engine.getFoundCount(),
    totalItems: engine.getTotalItems(),
    score: engine.getScore(),
    level: engine.getLevel(),
    gameOver: engine.isGameOver(),
    levelComplete: engine.isLevelComplete(),
  });
  const [distractors] = useState(() => engine.getDistractors());
  const [foundItems, setFoundItems] = useState<{ x: number; y: number; name: string; emoji: string }[]>([]);
  const [lastFound, setLastFound] = useState<string | null>(null);
  const [highScore, setHighScore] = useLocalStorage(STORAGE_KEYS_HIDDEN_PICTURE, { score: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const updateDisplay = useCallback(() => {
    setGameState({
      levelConfig: engine.getLevelConfig(),
      items: engine.getItems(),
      foundCount: engine.getFoundCount(),
      totalItems: engine.getTotalItems(),
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

    if (result.found && result.item) {
      setLastFound(result.item.name);
      setFoundItems(prev => [...prev, {
        x: result.item.x,
        y: result.item.y,
        name: result.item.name,
        emoji: result.item.emoji,
      }]);
      updateDisplay();
      
      setTimeout(() => setLastFound(null), 2000);
    }
  }, [engine, updateDisplay, gameState]);

  const startGame = () => {
    engine.reset();
    setFoundItems([]);
    updateDisplay();
  };

  const handleNextLevel = () => {
    engine.nextLevel();
    setFoundItems([]);
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
    return `${mins}:${secs.toString().padStart(2, '0')};
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
          🎯 隐藏的图片
        </h1>
        <p className="text-gray-400">{gameState.levelConfig.name}</p>
      </motion.div>

      <div className="flex gap-6 mb-4">
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">关卡</div>
          <div className="text-2xl font-bold text-purple-400">{gameState.level}</div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">已找到</div>
          <div className="text-2xl font-bold text-green-400">
            {gameState.foundCount} / {gameState.totalItems}
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
            <span>{Math.round((gameState.foundCount / gameState.totalItems) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${(gameState.foundCount / gameState.totalItems) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      <div className="mb-4 w-full max-w-4xl">
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400 mb-2">需要找到：</div>
          <div className="flex flex-wrap gap-2">
            {gameState.levelConfig.items.map((item, idx) => {
              const foundItem = gameState.items.find(i => i.name === item.name);
              const isFound = foundItem?.found;
              return (
                <motion.div
                  key={idx}
                  className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 ${
                  isFound ? 'bg-green-600/50 text-green-400' : 'bg-gray-700 text-gray-300'
                }`}
                initial={{ opacity: isFound ? 0.5 : 1 }}
              >
                  <span className="text-lg">{item.emoji}</span>
                  <span>{item.name}</span>
                  {isFound && <span>✓</span>}
                </motion.div>
              );
            }}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {lastFound && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="absolute top-1/4 z-50 glass-card px-8 py-4 rounded-xl"
          >
            <div className="text-green-400 font-bold text-xl">✓ 找到 {lastFound}！</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <div className="glass-card rounded-2xl p-4">
          <div
            ref={canvasRef}
            className="relative cursor-crosshair rounded-xl overflow-hidden"
            style={{
              width: HIDDEN_PICTURE_CONSTANTS.CANVAS_WIDTH,
              height: HIDDEN_PICTURE_CONSTANTS.CANVAS_HEIGHT,
              background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)',
            }}
            onClick={handleCanvasClick}
          >
            {distractors.map((dist, idx) => (
              <div
                key={`dist-${idx}`}
                className="absolute text-3xl"
                style={{
                  left: dist.x,
                  top: dist.y,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {dist.emoji}
              </div>
            ))}

            {gameState.items.map((item, idx) => (
              <div
                key={item.id}
                className="absolute text-3xl"
                style={{
                  left: item.x,
                  top: item.y,
                  transform: 'translate(-50%, -50%)',
                  opacity: item.found ? 0.3 : 1,
                  filter: item.found ? 'grayscale(100%)' : 'none',
                }}
              >
                {item.emoji}
              </div>
            ))}

            {foundItems.map((found, idx) => (
              <motion.div
                key={`found-${idx}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute border-4 border-green-500 rounded-full bg-green-500/20 flex items-center justify-center"
                style={{
                  left: found.x - 35,
                  top: found.y - 35,
                  width: 70,
                  height: 70,
                  pointerEvents: 'none',
                }}
              >
                <span className="text-2xl">✓</span>
              </motion.div>
            ))}
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
                        找到 {gameState.foundCount} / {gameState.totalItems} 个物品
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
            <div>• 仔细观察屏幕，找到列表中的物品</div>
            <div>• 点击找到的物品可能隐藏在混乱的表情符号中</div>
            <div>• 不要被干扰物分散注意力</div>
            <div>• 尽快找到所有物品以获得时间奖励</div>
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
