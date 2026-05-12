import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { IntChessEngine, Player, PieceType, Position } from './engine';

const CANVAS_WIDTH = 560;
const CANVAS_HEIGHT = 560;
const CELL_SIZE = 70;

type GameStatus = 'idle' | 'playing' | 'promoting' | 'gameover';

export default function InternationalChess() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<IntChessEngine | null>(null);
  const animationFrameRef = useRef<number>(0);

  const [bestScore, setBestScore] = useLocalStorage<number>('intchess_highscore', 0);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [currentTurn, setCurrentTurn] = useState<Player>('white');
  const [gameResult, setGameResult] = useState<string>('');
  const [gameScore, setGameScore] = useState<number>(0);
  const [promotionPos, setPromotionPos] = useState<Position | null>(null);
  const [, forceUpdate] = useState({});

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
    if (currentTurn !== 'white') return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);

    if (row < 0 || row > 7 || col < 0 || col > 7) return;

    const state = engine.getState();

    if (state.promotionPending) {
      setPromotionPos(state.promotionPending);
      setGameStatus('promoting');
      return;
    }

    engine.selectPiece(row, col);
    renderGame();

    const newState = engine.getState();
    setCurrentTurn(newState.currentPlayer);

    if (newState.isGameOver) {
      setGameStatus('gameover');
      if (newState.winner === 'white') {
        setGameResult('白方获胜！');
        setGameScore(100);
        if (100 > bestScore) {
          setBestScore(100);
        }
      } else if (newState.winner === 'black') {
        setGameResult('黑方获胜！');
        setGameScore(0);
      } else {
        setGameResult('和局！');
        setGameScore(50);
      }
    }
  }, [gameStatus, currentTurn, renderGame, bestScore, setBestScore]);

  const handlePromotion = useCallback((type: PieceType) => {
    const engine = engineRef.current;
    if (!engine || !promotionPos) return;

    engine.promotePawn(promotionPos.row, promotionPos.col, type);
    setPromotionPos(null);
    setGameStatus('playing');
    renderGame();

    const newState = engine.getState();
    setCurrentTurn(newState.currentPlayer);

    if (newState.isGameOver) {
      setGameStatus('gameover');
      if (newState.winner === 'white') {
        setGameResult('白方获胜！');
        setGameScore(100);
      } else if (newState.winner === 'black') {
        setGameResult('黑方获胜！');
        setGameScore(0);
      } else {
        setGameResult('和局！');
        setGameScore(50);
      }
    }
  }, [promotionPos, renderGame]);

  useEffect(() => {
    engineRef.current = new IntChessEngine();

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
        if (state.currentPlayer !== currentTurn || state.isGameOver !== (gameStatus === 'gameover')) {
          setCurrentTurn(state.currentPlayer);
          if (state.isGameOver) {
            setGameStatus('gameover');
            if (state.winner === 'white') {
              setGameResult('白方获胜！');
              setGameScore(100);
            } else if (state.winner === 'black') {
              setGameResult('黑方获胜！');
              setGameScore(0);
            } else {
              setGameResult('和局！');
              setGameScore(50);
            }
          }
          renderGame();
        }
        if (state.promotionPending) {
          setPromotionPos(state.promotionPending);
          setGameStatus('promoting');
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
    setCurrentTurn('white');
    setGameScore(0);
    setGameResult('');
    setPromotionPos(null);
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
            国际象棋
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
              backgroundColor: currentTurn === 'white' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(100, 100, 100, 0.2)',
              border: `2px solid ${currentTurn === 'white' ? '#ccc' : '#666'}`,
              color: currentTurn === 'white' ? '#ffffff' : '#888'
            }}
          >
            <span className="text-lg font-bold">白方</span>
            <span className="text-sm opacity-70">玩家</span>
          </div>

          <div className="text-xl font-bold" style={{ color: NEON_COLORS.gold }}>VS</div>

          <div
            className="px-6 py-3 rounded-xl flex items-center gap-2"
            style={{
              backgroundColor: currentTurn === 'black' ? 'rgba(30, 30, 30, 0.8)' : 'rgba(100, 100, 100, 0.2)',
              border: `2px solid ${currentTurn === 'black' ? '#444' : '#666'}`,
              color: currentTurn === 'black' ? '#cccccc' : '#888'
            }}
          >
            <span className="text-lg font-bold">黑方</span>
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
            {gameStatus === 'playing' && currentTurn === 'white' && '白方回合，点击选择棋子'}
            {gameStatus === 'playing' && currentTurn === 'black' && 'AI思考中...'}
            {gameStatus === 'promoting' && '兵升变！选择要升级的棋子'}
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
            {gameStatus === 'promoting' && promotionPos && (
              <motion.div
                className="absolute flex flex-col"
                style={{
                  left: promotionPos.col * CELL_SIZE,
                  top: promotionPos.row * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE * 4,
                  backgroundColor: 'rgba(0, 0, 0, 0.9)'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {(['queen', 'rook', 'bishop', 'knight'] as PieceType[]).map((type, i) => (
                  <motion.button
                    key={type}
                    onClick={() => handlePromotion(type)}
                    className="flex-1 flex items-center justify-center text-4xl hover:bg-gray-700 transition-colors"
                    style={{ color: '#fff' }}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    {type === 'queen' && '♕'}
                    {type === 'rook' && '♖'}
                    {type === 'bishop' && '♗'}
                    {type === 'knight' && '♘'}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

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
                  国际象棋
                </h2>
                <p className="text-lg mb-8 opacity-70" style={{ color: NEON_COLORS.white }}>
                  与AI对弈，体验经典国际象棋
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
            <div className="font-semibold mb-1">棋子价值</div>
            <div>后9 车5 象3 马3 兵1</div>
          </div>
          <div>
            <div className="font-semibold mb-1">获胜条件</div>
            <div>将杀对方王或逼迫对方无棋可走</div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs opacity-40" style={{ color: NEON_COLORS.gold }}>
          提示：白方先手，点击棋子选中后再点击目标位置移动
        </div>
      </motion.div>
    </div>
  );
}
