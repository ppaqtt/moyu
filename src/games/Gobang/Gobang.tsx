import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { GOBANG_CONSTANTS, STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { GobangEngine, Player, Position } from './engine';

const { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, CELL_SIZE } = GOBANG_CONSTANTS;

type GameStatus = 'idle' | 'playing' | 'gameover';

export default function Gobang() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GobangEngine | null>(null);
  const animationFrameRef = useRef<number>(0);

  const [bestScore, setBestScore] = useLocalStorage<number>(STORAGE_KEYS.GOBANG, 0);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [currentTurn, setCurrentTurn] = useState<Player>('black');
  const [gameResult, setGameResult] = useState<string>('');
  const [gameScore, setGameScore] = useState<number>(0);

  const renderGame = useCallback(() => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    engine.render(ctx);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine || gameStatus !== 'playing') return;
    if (currentTurn !== 'black') return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const offset = CELL_SIZE / 2;

    const col = Math.round((x - offset) / CELL_SIZE);
    const row = Math.round((y - offset) / CELL_SIZE);

    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return;

    const state = engine.getState();
    if (state.board[row][col] !== null) return;

    engine.placeStone(row, col);
    renderGame();

    const newState = engine.getState();
    setCurrentTurn(newState.currentPlayer);

    if (newState.isGameOver) {
      setGameStatus('gameover');
      if (newState.winner === 'black') {
        setGameResult('黑方获胜！');
        setGameScore(100);
        if (100 > bestScore) {
          setBestScore(100);
        }
      } else if (newState.winner === 'white') {
        setGameResult('白方获胜！');
        setGameScore(0);
      } else {
        setGameResult('平局！');
        setGameScore(50);
      }
    } else {
      setTimeout(async () => {
        await engine.makeAIMove();
        renderGame();
        const aiState = engine.getState();
        setCurrentTurn(aiState.currentPlayer);

        if (aiState.isGameOver) {
          setGameStatus('gameover');
          if (aiState.winner === 'black') {
            setGameResult('黑方获胜！');
            setGameScore(100);
            if (100 > bestScore) {
              setBestScore(100);
            }
          } else if (aiState.winner === 'white') {
            setGameResult('白方获胜！');
            setGameScore(0);
          } else {
            setGameResult('平局！');
            setGameScore(50);
          }
        }
      }, 100);
    }
  }, [gameStatus, currentTurn, renderGame, bestScore, setBestScore]);

  useEffect(() => {
    engineRef.current = new GobangEngine();

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        engineRef.current.render(ctx);
      }
    }

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        engineRef.current.render(ctx);
      }
    }
    setGameStatus('playing');
    setCurrentTurn('black');
    setGameScore(0);
    setGameResult('');
  }, []);

  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)'
      }}
    >
      <motion.div
        className="glass-card rounded-3xl p-8 max-w-[640px] w-full"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
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
              boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}40`
            }}
            whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${NEON_COLORS.neonBlue}` }}
            whileTap={{ scale: 0.95 }}
          >
            返回
          </motion.button>

          <h1 className="text-3xl font-bold" style={{ color: NEON_COLORS.gold }}>
            五子棋
          </h1>

          <div className="text-center">
            <div className="text-xs opacity-60" style={{ color: NEON_COLORS.gold }}>最高记录</div>
            <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonBlue }}>
              {bestScore}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 mb-4">
          <div
            className="px-6 py-3 rounded-xl flex items-center gap-2"
            style={{
              backgroundColor: currentTurn === 'black' && gameStatus === 'playing' ? 'rgba(30, 30, 30, 0.8)' : 'rgba(100, 100, 100, 0.2)',
              border: `2px solid ${currentTurn === 'black' ? '#444' : '#666'}`,
              color: currentTurn === 'black' ? '#cccccc' : '#888'
            }}
          >
            <div
              className="w-5 h-5 rounded-full"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #4a4a4a, #1a1a1a, #000)',
                boxShadow: 'inset 0 0 3px rgba(255,255,255,0.3)'
              }}
            />
            <span className="text-lg font-bold">黑方</span>
            <span className="text-sm opacity-70">玩家</span>
          </div>

          <div className="text-xl font-bold" style={{ color: NEON_COLORS.gold }}>VS</div>

          <div
            className="px-6 py-3 rounded-xl flex items-center gap-2"
            style={{
              backgroundColor: currentTurn === 'white' && gameStatus === 'playing' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(100, 100, 100, 0.2)',
              border: `2px solid ${currentTurn === 'white' ? '#ccc' : '#666'}`,
              color: currentTurn === 'white' ? '#ffffff' : '#888'
            }}
          >
            <div
              className="w-5 h-5 rounded-full"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #fff, #e8e8e8, #ccc)',
                boxShadow: 'inset 0 0 3px rgba(0,0,0,0.3)'
              }}
            />
            <span className="text-lg font-bold">白方</span>
            <span className="text-sm opacity-70">AI</span>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <div
            className="px-4 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: NEON_COLORS.darkPurple,
              color: NEON_COLORS.neonPink,
              border: `1px solid ${NEON_COLORS.neonPink}40`
            }}
          >
            {gameStatus === 'idle' && '点击开始游戏'}
            {gameStatus === 'playing' && currentTurn === 'black' && '轮到你了，点击棋盘放置棋子'}
            {gameStatus === 'playing' && currentTurn === 'white' && 'AI思考中...'}
            {gameStatus === 'gameover' && gameResult}
          </div>
        </div>

        <motion.div
          className="relative mx-auto"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30, inset 0 0 50px rgba(0,0,0,0.5)`,
            border: `2px solid ${NEON_COLORS.neonPink}40`
          }}
          whileHover={{ boxShadow: `0 0 40px ${NEON_COLORS.neonPink}50` }}
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
              height: '100%'
            }}
          />

          <AnimatePresence>
            {gameStatus === 'idle' && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ backgroundColor: 'rgba(15, 15, 26, 0.9)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-3xl font-bold mb-8" style={{ color: NEON_COLORS.gold }}>
                  五子棋
                </h2>
                <p className="text-lg mb-8 opacity-70" style={{ color: NEON_COLORS.white }}>
                  与AI对弈，先连成五子获胜
                </p>
                <motion.button
                  onClick={startGame}
                  className="px-8 py-4 rounded-xl font-bold text-xl"
                  style={{
                    backgroundColor: NEON_COLORS.neonPink,
                    color: NEON_COLORS.white,
                    boxShadow: `0 0 30px ${NEON_COLORS.neonPink}`
                  }}
                  whileHover={{ scale: 1.05, boxShadow: `0 0 50px ${NEON_COLORS.neonPink}` }}
                  whileTap={{ scale: 0.95 }}
                >
                  开始游戏
                </motion.button>
              </motion.div>
            )}

            {gameStatus === 'gameover' && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ backgroundColor: 'rgba(15, 15, 26, 0.95)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
                  {gameResult}
                </div>
                {gameScore > 0 && (
                  <div className="text-2xl mb-8" style={{ color: NEON_COLORS.gold }}>
                    本局得分: {gameScore}
                  </div>
                )}
                <div className="flex gap-4">
                  <motion.button
                    onClick={startGame}
                    className="px-6 py-3 rounded-lg font-bold"
                    style={{
                      backgroundColor: NEON_COLORS.neonPink,
                      color: NEON_COLORS.white,
                      boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    再来一局
                  </motion.button>
                  <motion.button
                    onClick={handleExit}
                    className="px-6 py-3 rounded-lg font-bold"
                    style={{
                      backgroundColor: NEON_COLORS.darkPurple,
                      color: NEON_COLORS.neonBlue,
                      border: `2px solid ${NEON_COLORS.neonBlue}`
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    返回首页
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-center text-sm opacity-60" style={{ color: NEON_COLORS.gold }}>
          <div>
            <div className="font-semibold mb-1">游戏规则</div>
            <div>黑子先手，AI执白</div>
          </div>
          <div>
            <div className="font-semibold mb-1">获胜条件</div>
            <div>横竖斜任意方向连成5子</div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs opacity-40" style={{ color: NEON_COLORS.gold }}>
          提示：黑方先手，点击棋盘交叉点放置棋子
        </div>
      </motion.div>
    </div>
  );
}
