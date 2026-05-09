import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { MilitaryChessEngine, Player, Position } from './engine';

const CANVAS_WIDTH = 605;
const CANVAS_HEIGHT = 660;
const CELL_WIDTH = 55;
const CELL_HEIGHT = 55;

type GameStatus = 'idle' | 'placing' | 'playing' | 'gameover';

export default function MilitaryChess() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<MilitaryChessEngine | null>(null);
  const animationFrameRef = useRef<number>(0);

  const [bestScore, setBestScore] = useLocalStorage<number>('militarychess_highscore', 0);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [currentTurn, setCurrentTurn] = useState<Player>('red');
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
    if (!canvas || !engine) return;
    if (gameStatus !== 'playing' && gameStatus !== 'placing') return;
    if (currentTurn !== 'red') return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const col = Math.floor(x / CELL_WIDTH);
    const row = Math.floor(y / CELL_HEIGHT);

    if (row < 0 || row >= 12 || col < 0 || col >= 11) return;

    const selected = engine.selectPiece(row, col);
    renderGame();

    const state = engine.getState();

    if (state.isGameOver) {
      setGameStatus('gameover');
      if (state.winner === 'red') {
        setGameResult('红方获胜！');
        setGameScore(100);
        if (100 > bestScore) {
          setBestScore(100);
        }
      } else {
        setGameResult('蓝方获胜！');
        setGameScore(0);
      }
    }
  }, [gameStatus, currentTurn, renderGame, bestScore, setBestScore]);

  useEffect(() => {
    engineRef.current = new MilitaryChessEngine();
    engineRef.current.reset();

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        engineRef.current.render(ctx);
      }
    }

    const animate = () => {
      const engine = engineRef.current;
      if (engine) {
        const state = engine.getState();
        if (state.isGameOver) {
          setGameStatus('gameover');
          if (state.winner === 'red') {
            setGameResult('红方获胜！');
            setGameScore(100);
          } else {
            setGameResult('蓝方获胜！');
            setGameScore(0);
          }
        }
      }
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
    setCurrentTurn('red');
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
        className="glass-card rounded-3xl p-8 max-w-[700px] w-full"
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
            军棋
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
              backgroundColor: currentTurn === 'red' ? 'rgba(220, 38, 38, 0.3)' : 'rgba(100, 100, 100, 0.2)',
              border: `2px solid ${currentTurn === 'red' ? '#dc2626' : '#666'}`,
              color: currentTurn === 'red' ? '#ffcccc' : '#888'
            }}
          >
            <span className="text-lg font-bold">红方</span>
            <span className="text-sm opacity-70">玩家</span>
          </div>

          <div className="text-xl font-bold" style={{ color: NEON_COLORS.gold }}>VS</div>

          <div
            className="px-6 py-3 rounded-xl flex items-center gap-2"
            style={{
              backgroundColor: currentTurn === 'blue' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(100, 100, 100, 0.2)',
              border: `2px solid ${currentTurn === 'blue' ? '#3b82f6' : '#666'}`,
              color: currentTurn === 'blue' ? '#93c5fd' : '#888'
            }}
          >
            <span className="text-lg font-bold">蓝方</span>
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
            {gameStatus === 'playing' && currentTurn === 'red' && '红方回合，点击选择棋子'}
            {gameStatus === 'playing' && currentTurn === 'blue' && 'AI思考中...'}
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
                  军棋
                </h2>
                <p className="text-lg mb-8 opacity-70" style={{ color: NEON_COLORS.white }}>
                  与AI对弈，体验经典军棋博弈
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
            <div className="font-semibold mb-1">军衔大小</div>
            <div>司令 &gt; 军长 &gt; 师长 &gt; 旅长 &gt; 团长 &gt; 营长 &gt; 连长 &gt; 排长 &gt; 工兵 &gt; 兵</div>
          </div>
          <div>
            <div className="font-semibold mb-1">特殊规则</div>
            <div>地雷：用工兵挖，其他撞死 | 炸弹：同归于尽</div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs opacity-40" style={{ color: NEON_COLORS.gold }}>
          提示：红方先手，点击棋子移动，绿色圆点为可移动位置
        </div>
      </motion.div>
    </div>
  );
}
