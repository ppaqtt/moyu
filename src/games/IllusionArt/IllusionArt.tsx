import { useState, useEffect, useCallback, useRef } from 'react';
import { IllusionArtEngine } from './engine';
import { ILLUSION_ART_CONSTANTS, STORAGE_KEYS_ILLUSION_ART } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export default function IllusionArt() {
  const [timeLeft, setTimeLeft] = useState(ILLUSION_ART_CONSTANTS.TIME_LIMIT);
  const [engine] = useState(() => new IllusionArtEngine(setTimeLeft));
  const [gameState, setGameState] = useState({
    illusions: engine.getIllusions(),
    currentIllusion: engine.getCurrentIllusion(),
    drawingPoints: engine.getDrawingPoints(),
    score: engine.getScore(),
    level: engine.getLevel(),
    gameOver: engine.isGameOver(),
    levelComplete: engine.isLevelComplete(),
    completedCount: engine.getCompletedCount(),
    totalCount: engine.getTotalCount(),
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [highScore, setHighScore] = useLocalStorage(STORAGE_KEYS_ILLUSION_ART, { score: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [rotation, setRotation] = useState(0);

  const updateDisplay = useCallback(() => {
    setGameState({
      illusions: engine.getIllusions(),
      currentIllusion: engine.getCurrentIllusion(),
      drawingPoints: engine.getDrawingPoints(),
      score: engine.getScore(),
      level: engine.getLevel(),
      gameOver: engine.isGameOver(),
      levelComplete: engine.isLevelComplete(),
      completedCount: engine.getCompletedCount(),
      totalCount: engine.getTotalCount(),
    });
  }, [engine]);

  const startDrawing = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState.gameOver || gameState.levelComplete) return;
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    engine.addDrawingPoint(x, y);
    updateDisplay();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleIllusionSelect = (id: string) => {
    engine.selectIllusion(id);
    updateDisplay();
  };

  const startGame = () => {
    engine.reset();
    updateDisplay();
  };

  const handleNextLevel = () => {
    engine.nextLevel();
    updateDisplay();
  };

  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      setRotation(r => (r + 1) % 360);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

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

  const renderIllusionEffect = () => {
    const illusion = gameState.currentIllusion;
    if (!illusion) return null;

    switch (illusion.type) {
      case 'rotating':
        return (
          <div 
            style={{ transform: `rotate(${rotation}deg)` }}
            className="w-full h-full flex items-center justify-center"
          >
            <div className="w-64 h-64 rounded-full" 
                 style={{
                   background: 'conic-gradient(from 0deg, #ff006e, #8338ec, #3a86ff, #06ffa5, #ffbe0b, #fb5607, #ff006e)',
                 }}
            />
          </div>
        );
      
      case 'strobing':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div 
              className="w-64 h-64 flex items-center justify-center"
              style={{
                animation: 'pulse 0.5s infinite alternate',
              }}
            >
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500" />
            </div>
          </div>
        );
      
      case 'color-shift':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div 
              className="w-64 h-64"
              style={{
                background: `linear-gradient(${rotation}deg, #ff006e, #8338ec, #3a86ff, #06ffa5)`,
              }}
            />
          </div>
        );
      
      case 'pattern':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div 
              style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '4px',
                transform: `rotate(${rotation * 0.1}deg)`,
              }}
            >
              {[...Array(16)].map((_, i) => (
                <div 
                  key={i}
                  className="w-12 h-12"
                  style={{
                    background: i % 2 === 0 ? '#ff006e' : '#8338ec',
                    transform: `rotate(${i * 30 + rotation}deg)`,
                  }}
                />
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
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
          🎨 错觉绘画
        </h1>
        <p className="text-gray-400">在画布上绘制，创造神奇的视觉效果！</p>
      </motion.div>

      <div className="flex gap-6 mb-4">
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">关卡</div>
          <div className="text-2xl font-bold text-purple-400">{gameState.level}</div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">已完成</div>
          <div className="text-2xl font-bold text-green-400">
            {gameState.completedCount} / {gameState.totalCount}
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
            <span>{Math.round((gameState.completedCount / gameState.totalCount) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${(gameState.completedCount / gameState.totalCount) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      <div className="mb-4 w-full max-w-4xl">
        <div className="glass-card px-4 py-3 rounded-xl">
          <div className="text-sm text-gray-400 mb-2">选择错觉效果：</div>
          <div className="flex gap-3 flex-wrap">
            {gameState.illusions.map((illusion) => (
              <button
                key={illusion.id}
                onClick={() => handleIllusionSelect(illusion.id)}
                disabled={illusion.completed}
                className={`px-4 py-2 rounded-lg transition-all ${
                  gameState.currentIllusion?.id === illusion.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : illusion.completed
                    ? 'bg-green-800/50 text-green-400 opacity-60'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {illusion.name} {illusion.completed && '✓'}
                <div className="text-xs mt-1">
                  {illusion.currentSteps}/{illusion.targetSteps}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="glass-card rounded-2xl p-4">
          <div className="flex gap-4">
            <div
              ref={canvasRef}
              className="relative cursor-crosshair rounded-xl overflow-hidden"
              style={{
                width: ILLUSION_ART_CONSTANTS.CANVAS_WIDTH / 2,
                height: ILLUSION_ART_CONSTANTS.CANVAS_HEIGHT,
                background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)',
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            >
              <div className="absolute inset-0 flex items-center justify-center text-gray-600 pointer-events-none">
                点击并拖动画画
              </div>
              {gameState.drawingPoints.map((point, i) => (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: point.x - 4,
                    top: point.y - 4,
                    width: 8,
                    height: 8,
                    backgroundColor: `hsl(${(i * 5) % 360}, 70%, 60%)`,
                  }}
                />
              ))}
            </div>

            <div
              className="relative rounded-xl overflow-hidden"
              style={{
                width: ILLUSION_ART_CONSTANTS.CANVAS_WIDTH / 2,
                height: ILLUSION_ART_CONSTANTS.CANVAS_HEIGHT,
                background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)',
              }}
            >
              {renderIllusionEffect()}
              {gameState.currentIllusion && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-cyan-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(gameState.currentIllusion.currentSteps / gameState.currentIllusion.targetSteps) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-1 text-center">
                    {gameState.currentIllusion.currentSteps}/{gameState.currentIllusion.targetSteps} 步
                  </div>
                </div>
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
                        完成了 {gameState.completedCount} / {gameState.totalCount} 个错觉效果
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
          <h3 className="text-lg font-semibold text-pink-400 mb-3">🎨 游戏技巧</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-300 text-sm">
            <div>• 在左侧画布上绘制来完成每个错觉效果</div>
            <div>• 每个效果需要达到指定的绘制步数</div>
            <div>• 完成所有效果即可过关</div>
            <div>• 快速绘制以获得时间奖励</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .glass-card {
          background: rgba(26, 26, 46, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(108, 92, 231, 0.3);
        }
        
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0.6; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
