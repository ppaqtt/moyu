import { useRef, useEffect, useState, useCallback } from 'react';
import { BubbleShooterEngine } from './engine';
import { BUBBLE_SHOOTER_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export default function BubbleShooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BubbleShooterEngine | null>(null);
  const [highScore, setHighScore] = useLocalStorage(STORAGE_KEYS.BUBBLE_SHOOTER, { highScore: 0 });
  const [currentScore, setCurrentScore] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover'>('idle');
  const navigate = useNavigate();

  const handleScoreUpdate = useCallback((newScore: number) => {
    setCurrentScore(newScore);
  }, []);

  const handleGameOver = useCallback(() => {
    setGameState('gameover');
    if (currentScore > highScore.highScore) {
      setHighScore({ highScore: currentScore });
    }
  }, [currentScore, highScore.highScore, setHighScore]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = BUBBLE_SHOOTER_CONSTANTS.CANVAS_WIDTH;
    canvas.height = BUBBLE_SHOOTER_CONSTANTS.CANVAS_HEIGHT;

    const engine = new BubbleShooterEngine(canvas, handleScoreUpdate, handleGameOver);
    engineRef.current = engine;

    return () => {
      engine.stop();
    };
  }, [handleScoreUpdate, handleGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!engineRef.current || gameState !== 'playing') return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const shooterX = canvas.width / 2;
      const shooterY = canvas.height - 50;

      const angle = Math.atan2(y - shooterY, x - shooterX);
      engineRef.current.setAngle(angle);
    };

    const handleClick = () => {
      if (engineRef.current && gameState === 'playing') {
        engineRef.current.shoot();
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [gameState]);

  const startGame = () => {
    if (engineRef.current) {
      if (gameState === 'gameover') {
        engineRef.current.reset();
        setCurrentScore(0);
      }
      engineRef.current.start();
      setGameState('playing');
    }
  };

  const pauseGame = () => {
    if (engineRef.current) {
      engineRef.current.stop();
      setGameState('paused');
    }
  };

  const resumeGame = () => {
    if (engineRef.current) {
      engineRef.current.start();
      setGameState('playing');
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
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
          泡泡龙 Bubble Shooter
        </h1>
        <p className="text-gray-400">射击泡泡，匹配消除三个以上同色球！</p>
      </motion.div>

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
          <div className="text-2xl font-bold text-cyan-400">{highScore.highScore}</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative"
      >
        <div className="glass-card rounded-2xl p-4">
          <canvas
            ref={canvasRef}
            className="rounded-xl cursor-crosshair"
            style={{
              boxShadow: '0 0 30px rgba(108, 92, 231, 0.3), inset 0 0 60px rgba(0, 0, 0, 0.3)'
            }}
          />

          {(gameState === 'idle' || gameState === 'gameover') && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                {gameState === 'gameover' && (
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-red-500 mb-2">游戏结束</div>
                    <div className="text-xl text-yellow-400">最终得分: {currentScore}</div>
                    {currentScore >= highScore.highScore && currentScore > 0 && (
                      <div className="text-lg text-green-400 mt-2">🎉 新纪录！</div>
                    )}
                  </div>
                )}
                <button
                  onClick={startGame}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  {gameState === 'idle' ? '开始游戏' : '再来一局'}
                </button>
              </motion.div>
            </div>
          )}

          {gameState === 'paused' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-6">游戏暂停</div>
                <button
                  onClick={resumeGame}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-cyan-600 rounded-xl text-white font-bold text-lg hover:from-green-700 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-lg mr-4"
                >
                  继续游戏
                </button>
              </div>
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-between items-center mt-4 px-2"
        >
          <div className="text-gray-400 text-sm">
            🖱️ 移动鼠标瞄准 | 点击发射
          </div>
          <div className="flex gap-3">
            {gameState === 'playing' && (
              <button
                onClick={pauseGame}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-medium transition-colors"
              >
                ⏸️ 暂停
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
            >
              🏠 返回主页
            </button>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 max-w-2xl text-center"
      >
        <div className="glass-card px-6 py-4 rounded-xl">
          <h3 className="text-lg font-semibold text-purple-400 mb-2">🎯 游戏技巧</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• 移动鼠标控制瞄准方向</li>
            <li>• 点击发射泡泡到顶部网格</li>
            <li>• 匹配3个或更多相同颜色的泡泡即可消除</li>
            <li>• 消除悬挂的泡泡可以获得额外分数</li>
            <li>• 泡泡落到地面警戒线以下则游戏结束</li>
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
