import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { TICTACTOE_MASTER_CONSTANTS, STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { TicTacToeMasterEngine, Player, Difficulty, GameState } from './engine';

const { CANVAS_WIDTH, CANVAS_HEIGHT, CELL_SIZE } = TICTACTOE_MASTER_CONSTANTS;

type GameStatus = 'menu' | 'playing' | 'gameOver';

export default function TicTacToeMaster() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<TicTacToeMasterEngine | null>(null);

  const [bestScore, setBestScore] = useLocalStorage<number>(STORAGE_KEYS.TICTACTOE_MASTER, 0);
  const [gameStatus, setGameStatus] = useState<GameStatus>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [aiThinking, setAiThinking] = useState(false);

  const renderGame = useCallback(() => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    engine.render(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine || gameStatus !== 'playing' || aiThinking) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);

    if (engine.makeMove(row, col)) {
      const newState = engine.getState();
      setGameState(newState);
      renderGame();

      if (newState.isGameOver) {
        setGameStatus('gameOver');
        if (newState.winner === 'X') {
          const score = 100;
          if (score > bestScore) {
            setBestScore(score);
          }
        }
      } else if (newState.currentPlayer === 'O') {
        setAiThinking(true);
        setTimeout(async () => {
          await engine.makeAIMove();
          const aiState = engine.getState();
          setGameState(aiState);
          renderGame();
          setAiThinking(false);
          
          if (aiState.isGameOver) {
            setGameStatus('gameOver');
            if (aiState.winner === 'X') {
              const score = 100;
              if (score > bestScore) {
                setBestScore(score);
              }
            }
          }
        }, 100);
      }
    }
  }, [gameStatus, aiThinking, renderGame, bestScore, setBestScore]);

  useEffect(() => {
    engineRef.current = new TicTacToeMasterEngine(difficulty);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        engineRef.current.render(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
    }

    const animate = () => {
      requestAnimationFrame(animate);
    };

    animate();
  }, [difficulty]);

  const startGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset(difficulty);
      setGameState(engineRef.current.getState());
      renderGame();
    }
    setGameStatus('playing');
    setAiThinking(false);
  }, [difficulty, renderGame]);

  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const getDifficultyLabel = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return '中等';
    }
  };

  const getResultText = () => {
    if (!gameState) return '';
    if (gameState.winner === 'X') return '恭喜你赢了！';
    if (gameState.winner === 'O') return 'AI获胜了！';
    return '平局！';
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      }}
    >
      <motion.div
        className="glass-card rounded-3xl p-8 max-w-[600px] w-full"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <motion.button
            onClick={handleExit}
            className="px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300"
            style={{
              backgroundColor: NEON_COLORS.darkPurple,
              color: NEON_COLORS.neonBlue,
              boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}40`,
            }}
            whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${NEON_COLORS.neonBlue}` }}
            whileTap={{ scale: 0.95 }}
          >
            返回
          </motion.button>

          <h1 className="text-3xl font-bold" style={{ color: NEON_COLORS.gold }}>
            井字棋大师
          </h1>

          <div className="text-center">
            <div className="text-xs opacity-60" style={{ color: NEON_COLORS.gold }}>
              最高记录
            </div>
            <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonBlue }}>
              {bestScore}
            </div>
          </div>
        </div>

        {gameStatus === 'menu' && (
          <motion.div
            className="flex flex-col items-center justify-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="mb-8">
              <h2 className="text-xl font-bold text-center mb-4" style={{ color: NEON_COLORS.neonPink }}>
                选择难度
              </h2>
              <div className="flex gap-4">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                  <motion.button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`px-6 py-3 rounded-lg font-bold transition-all duration-300 ${
                      difficulty === diff ? 'scale-110' : ''
                    }`}
                    style={{
                      backgroundColor:
                        difficulty === diff
                          ? NEON_COLORS.neonPink
                          : NEON_COLORS.darkPurple,
                      color: NEON_COLORS.white,
                      boxShadow:
                        difficulty === diff
                          ? `0 0 20px ${NEON_COLORS.neonPink}`
                          : 'none',
                      border: `2px solid ${
                        difficulty === diff ? NEON_COLORS.neonPink : NEON_COLORS.neonBlue
                      }`,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {getDifficultyLabel(diff)}
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.button
              onClick={startGame}
              className="px-10 py-4 rounded-xl font-bold text-xl transition-all duration-300"
              style={{
                backgroundColor: NEON_COLORS.neonPink,
                color: NEON_COLORS.white,
                boxShadow: `0 0 30px ${NEON_COLORS.neonPink}`,
              }}
              whileHover={{ scale: 1.05, boxShadow: `0 0 50px ${NEON_COLORS.neonPink}` }}
              whileTap={{ scale: 0.95 }}
            >
              开始游戏
            </motion.button>
          </motion.div>
        )}

        {(gameStatus === 'playing' || gameStatus === 'gameOver') && (
          <>
            <div className="flex items-center justify-center gap-6 mb-4">
              <div
                className="px-6 py-3 rounded-xl flex items-center gap-2"
                style={{
                  backgroundColor:
                    gameState?.currentPlayer === 'X' && gameStatus === 'playing'
                      ? 'rgba(255, 107, 107, 0.2)'
                      : 'rgba(100, 100, 100, 0.2)',
                  border: `2px solid ${
                    gameState?.currentPlayer === 'X' && gameStatus === 'playing'
                      ? '#ff6b6b'
                      : '#666'
                  }`,
                }}
              >
                <span
                  className="text-2xl font-bold"
                  style={{ color: '#ff6b6b' }}
                >
                  X
                </span>
                <span className="text-sm opacity-70" style={{ color: NEON_COLORS.white }}>
                  玩家
                </span>
              </div>

              <div className="text-xl font-bold" style={{ color: NEON_COLORS.gold }}>
                VS
              </div>

              <div
                className="px-6 py-3 rounded-xl flex items-center gap-2"
                style={{
                  backgroundColor:
                    gameState?.currentPlayer === 'O' && gameStatus === 'playing'
                      ? 'rgba(78, 205, 196, 0.2)'
                      : 'rgba(100, 100, 100, 0.2)',
                  border: `2px solid ${
                    gameState?.currentPlayer === 'O' && gameStatus === 'playing'
                      ? '#4ecdc4'
                      : '#666'
                  }`,
                }}
              >
                <span
                  className="text-2xl font-bold"
                  style={{ color: '#4ecdc4' }}
                >
                  O
                </span>
                <span className="text-sm opacity-70" style={{ color: NEON_COLORS.white }}>
                  AI
                </span>
              </div>
            </div>

            <div className="flex justify-center mb-4">
              <div
                className="px-4 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: NEON_COLORS.darkPurple,
                  color: aiThinking ? NEON_COLORS.neonPink : NEON_COLORS.neonBlue,
                  border: `1px solid ${NEON_COLORS.neonBlue}40`,
                }}
              >
                {aiThinking && 'AI思考中...'}
                {!aiThinking && gameStatus === 'playing' && gameState?.currentPlayer === 'X' && '轮到你了！'}
                {!aiThinking && gameStatus === 'playing' && gameState?.currentPlayer === 'O' && 'AI回合'}
              </div>
            </div>

            <div className="flex justify-center mb-4">
              <motion.div
                className="relative"
                style={{
                  width: CANVAS_WIDTH,
                  height: CANVAS_HEIGHT,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30, inset 0 0 50px rgba(0,0,0,0.5)`,
                  border: `2px solid ${NEON_COLORS.neonPink}40`,
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  onClick={handleCanvasClick}
                  className="cursor-pointer"
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                  }}
                />
              </motion.div>
            </div>
          </>
        )}

        <AnimatePresence>
          {gameStatus === 'gameOver' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 rounded-3xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="text-4xl font-bold mb-4"
                style={{ color: NEON_COLORS.neonPink }}
              >
                {getResultText()}
              </div>
              <div className="flex gap-4">
                <motion.button
                  onClick={startGame}
                  className="px-6 py-3 rounded-lg font-bold transition-all duration-300"
                  style={{
                    backgroundColor: NEON_COLORS.neonPink,
                    color: NEON_COLORS.white,
                    boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  再来一局
                </motion.button>
                <motion.button
                  onClick={() => setGameStatus('menu')}
                  className="px-6 py-3 rounded-lg font-bold transition-all duration-300"
                  style={{
                    backgroundColor: NEON_COLORS.darkPurple,
                    color: NEON_COLORS.neonBlue,
                    border: `2px solid ${NEON_COLORS.neonBlue}`,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  返回菜单
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 text-center text-sm opacity-60" style={{ color: NEON_COLORS.gold }}>
          {gameStatus === 'menu' && '选择难度后开始游戏，玩家执X，AI执O'}
          {(gameStatus === 'playing' || gameStatus === 'gameOver') && (
            `当前难度: ${getDifficultyLabel(difficulty)}`
          )}
        </div>
      </motion.div>
    </div>
  );
}
