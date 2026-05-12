import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FruitNinjaEngine } from './engine';
import { FRUIT_NINJA_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const { CANVAS_WIDTH, CANVAS_HEIGHT } = FRUIT_NINJA_CONSTANTS;

type GameState = 'idle' | 'playing' | 'gameover';

export default function FruitNinja() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FruitNinjaEngine | null>(null);
  const gameLoopRef = useRef<number | null>(null);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [highScore, setHighScore] = useLocalStorage(STORAGE_KEYS.FRUIT_NINJA, 0);
  const [showCombo, setShowCombo] = useState(false);
  const navigate = useNavigate();

  const handleGameOver = useCallback((finalScore: number) => {
    setGameState('gameover');
    if (finalScore > highScore) {
      setHighScore(finalScore);
    }
    engineRef.current?.stop();
  }, [highScore, setHighScore]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    engineRef.current = new FruitNinjaEngine(canvas);

    const gameLoop = () => {
      if (!engineRef.current) return;

      const currentScore = engineRef.current.getScore();
      const currentCombo = engineRef.current.getCombo();
      const isOver = engineRef.current.isOver();

      setScore(currentScore);
      setCombo(currentCombo);

      if (currentCombo >= 3) {
        setShowCombo(true);
        setTimeout(() => setShowCombo(false), 500);
      }

      if (isOver && gameState === 'playing') {
        handleGameOver(currentScore);
        return;
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      engineRef.current?.stop();
    };
  }, [gameState, handleGameOver]);

  const startGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
      engineRef.current.start(() => {});
      setGameState('playing');
      setScore(0);
      setCombo(0);
    }
  }, []);

  const handleBack = () => {
    engineRef.current?.stop();
    navigate('/');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 text-center"
      >
        <h1
          className="text-4xl font-bold mb-2"
          style={{
            background: 'linear-gradient(135deg, #ff6b9d 0%, #ffa502 50%, #2ed573 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(255, 107, 157, 0.3)'
          }}
        >
          切水果
        </h1>
        <p className="text-gray-400 text-sm">滑动切割水果，获得高分！</p>
      </motion.div>

      <div className="relative">
        <div
          className="glass-card rounded-2xl overflow-hidden shadow-2xl"
          style={{
            boxShadow: '0 0 40px rgba(255, 107, 157, 0.2), 0 0 80px rgba(0, 210, 255, 0.1)'
          }}
        >
          <canvas
            ref={canvasRef}
            className="block cursor-pointer"
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              touchAction: 'none'
            }}
          />

          <div className="absolute top-4 left-4">
            <motion.div
              className="glass-card px-4 py-2 rounded-xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              key={score}
            >
              <p className="text-gray-400 text-xs">分数</p>
              <p className="text-2xl font-bold text-white">{score}</p>
            </motion.div>
          </div>

          <div className="absolute top-4 right-4">
            <motion.div
              className="glass-card px-4 py-2 rounded-xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <p className="text-gray-400 text-xs">最高分</p>
              <p className="text-xl font-bold text-yellow-400">{highScore}</p>
            </motion.div>
          </div>

          <AnimatePresence>
            {showCombo && combo >= 3 && (
              <motion.div
                className="absolute top-1/3 left-1/2 transform -translate-x-1/2"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div
                  className="px-6 py-3 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 107, 157, 0.9), rgba(255, 165, 2, 0.9))',
                    boxShadow: '0 0 30px rgba(255, 107, 157, 0.6)'
                  }}
                >
                  <p className="text-white font-bold text-2xl">
                    {combo}x 连击！
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {combo > 0 && combo < 3 && gameState === 'playing' && (
              <motion.div
                className="absolute bottom-24 left-1/2 transform -translate-x-1/2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <p
                  className="text-sm font-medium px-3 py-1 rounded-full"
                  style={{
                    background: 'rgba(46, 213, 115, 0.3)',
                    color: '#2ed573'
                  }}
                >
                  {combo}x 连击
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {gameState === 'idle' && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.button
                  className="px-8 py-4 rounded-2xl text-xl font-bold text-white mb-4"
                  style={{
                    background: 'linear-gradient(135deg, #ff6b9d 0%, #ffa502 100%)',
                    boxShadow: '0 4px 20px rgba(255, 107, 157, 0.4)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startGame}
                >
                  开始游戏
                </motion.button>
                <p className="text-gray-400 text-sm">滑动鼠标切割水果</p>
                <p className="text-gray-500 text-xs mt-2">小心炸弹！</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {gameState === 'gameover' && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="glass-card p-8 rounded-3xl text-center mb-6"
                  initial={{ scale: 0.8, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                >
                  <h2 className="text-3xl font-bold text-red-400 mb-4">游戏结束</h2>
                  <div className="mb-4">
                    <p className="text-gray-400">本局得分</p>
                    <p className="text-5xl font-bold text-white mb-2">{score}</p>
                    {score >= highScore && score > 0 && (
                      <motion.p
                        className="text-yellow-400 text-sm"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        🎉 新纪录！
                      </motion.p>
                    )}
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-gray-400 text-sm">最高纪录</p>
                    <p className="text-2xl font-bold text-yellow-400">{highScore}</p>
                  </div>
                </motion.div>

                <motion.button
                  className="px-8 py-4 rounded-2xl text-lg font-bold text-white mb-3"
                  style={{
                    background: 'linear-gradient(135deg, #ff6b9d 0%, #ffa502 100%)',
                    boxShadow: '0 4px 20px rgba(255, 107, 157, 0.4)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startGame}
                >
                  再来一局
                </motion.button>

                <motion.button
                  className="px-6 py-3 rounded-xl text-white glass-card"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBack}
                >
                  返回主页
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <motion.div
        className="mt-6 glass-card px-6 py-3 rounded-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-gray-400 text-sm text-center">
          🎮 提示: 滑动鼠标切割水果获得分数，躲避炸弹！
        </p>
      </motion.div>
    </div>
  );
}
