import { useState, useEffect, useCallback, useRef } from 'react';
import { VisionTrackEngine } from './engine';
import { VISION_TRACK_CONSTANTS, STORAGE_KEYS_VISION_TRACK } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export default function VisionTrack() {
  const [timeLeft, setTimeLeft] = useState(VISION_TRACK_CONSTANTS.TIME_LIMIT);
  const [gameState, setGameState] = useState<any>(null);
  const [engine, setEngine] = useState<VisionTrackEngine | null>(null);
  const [hitEffect, setHitEffect] = useState<{ x: number; y: number } | null>(null);
  const [highScore, setHighScore] = useLocalStorage(STORAGE_KEYS_VISION_TRACK, { score: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const initEngine = useCallback(() => {
    const eng = new VisionTrackEngine(setTimeLeft, (state) => setGameState({ ...state }));
    setEngine(eng);
    setGameState({
      objects: eng.getObjects(),
      targetsRemaining: eng.getTargetsRemaining(),
      totalTargets: eng.getTotalTargets(),
      timeLeft: eng.getTimeLeft(),
      score: eng.getScore(),
      level: eng.getLevel(),
      gameOver: eng.isGameOver(),
      levelComplete: eng.isLevelComplete(),
    });
  }, []);

  useEffect(() => {
    initEngine();
    return () => {
      if (engine) engine.stop();
    };
  }, [initEngine]);

  const updateDisplay = useCallback(() => {
    if (!engine) return;
    setGameState({
      objects: engine.getObjects(),
      targetsRemaining: engine.getTargetsRemaining(),
      totalTargets: engine.getTotalTargets(),
      timeLeft: engine.getTimeLeft(),
      score: engine.getScore(),
      level: engine.getLevel(),
      gameOver: engine.isGameOver(),
      levelComplete: engine.isLevelComplete(),
    });
  }, [engine]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!gameState || !engine) return;
    if (gameState.gameOver || gameState.levelComplete) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const result = engine.checkClick(x, y);

    if (result.hit && result.isTarget) {
      setHitEffect({ x, y });
      setTimeout(() => setHitEffect(null), 300);
      updateDisplay();
    }
  }, [engine, updateDisplay, gameState]);

  const startGame = useCallback(() => {
    if (!engine) return;
    engine.reset();
    updateDisplay();
    engine.start();
  }, [engine, updateDisplay]);

  const handleNextLevel = useCallback(() => {
    if (!engine) return;
    engine.nextLevel();
    updateDisplay();
    engine.start();
  }, [engine, updateDisplay]);

  useEffect(() => {
    if (gameState && gameState.score > highScore.score) {
      setHighScore({ score: gameState.score });
    }
  }, [gameState?.score, highScore.score, setHighScore]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!gameState || !engine) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' }}>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-6"
      >
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          🎯 视觉追踪
        </h1>
        <p className="text-gray-400">点击移动的目标形状！</p>
      </motion.div>

      <div className="flex gap-6 mb-4">
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">关卡</div>
          <div className="text-2xl font-bold text-purple-400">{gameState.level}</div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">剩余目标</div>
          <div className="text-2xl font-bold text-green-400">
            {gameState.targetsRemaining} / {gameState.totalTargets}
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
            <span>{Math.round(((gameState.totalTargets - gameState.targetsRemaining) / gameState.totalTargets) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${((gameState.totalTargets - gameState.targetsRemaining) / gameState.totalTargets) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      <div className="mb-4 w-full max-w-4xl">
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400 mb-2">目标类型：</div>
          <div className="flex gap-4 items-center">
            <span className="text-gray-300">点击带边框高亮的目标！</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="glass-card rounded-2xl p-4">
          <div
            ref={canvasRef}
            className="relative cursor-crosshair rounded-xl overflow-hidden"
            style={{
              width: VISION_TRACK_CONSTANTS.CANVAS_WIDTH,
              height: VISION_TRACK_CONSTANTS.CANVAS_HEIGHT,
              background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)',
            }}
            onClick={handleCanvasClick}
          >
            {gameState.objects.map((obj: any) => (
              <div
                key={obj.id}
                className="absolute flex items-center justify-center"
                style={{
                  left: obj.x - obj.size,
                  top: obj.y - obj.size,
                  width: obj.size * 2,
                  height: obj.size * 2,
                  transform: `rotate(${obj.rotation}rad)`,
                  transition: 'left 0.05s linear, top 0.05s linear',
                }}
              >
                <div
                  style={{
                    width: obj.size * 1.5,
                    height: obj.size * 1.5,
                    backgroundColor: obj.color,
                    borderRadius: obj.shape === 'circle' ? '50%' : obj.shape === 'square' ? '4px' : '0',
                    border: obj.isTarget ? '4px solid #FFD700' : 'none',
                    boxShadow: obj.isTarget ? '0 0 20px rgba(255, 215, 0, 0.6)' : 'none',
                  }}
                />
              </div>
            ))}

            {hitEffect && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                className="absolute border-4 border-yellow-400 rounded-full"
                style={{
                  left: hitEffect.x - 30,
                  top: hitEffect.y - 30,
                  width: 60,
                  height: 60,
                  pointerEvents: 'none',
                }}
              />
            )}
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
                        点击了 {gameState.totalTargets - gameState.targetsRemaining} / {gameState.totalTargets} 个目标
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
            <div>• 追踪并点击有金色边框的目标</div>
            <div>• 目标会不断移动，保持专注</div>
            <div>• 随着关卡升级，物体移动速度更快</div>
            <div>• 尽快点击目标以获得时间奖励</div>
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
