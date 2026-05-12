import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { HopChessEngine, Player, Position } from './engine';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 620;
const CELL_SIZE = 45;

type GameStatus = 'idle' | 'playing' | 'gameover';

export default function HopChess() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<HopChessEngine | null>(null);
  const animationFrameRef = useRef<number>(0);

  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [currentTurn, setCurrentTurn] = useState<Player>('red');
  const [gameResult, setGameResult] = useState<string>('');
  const [diceValue, setDiceValue] = useState<number>(0);
  const [isRolling, setIsRolling] = useState(false);
  const [message, setMessage] = useState<string>('点击开始游戏');

  const [bestScore, setBestScore] = useLocalStorage<number>('hopchess_highscore', 0);

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
    if (currentTurn !== 'red') return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);

    if (row < 0 || row > 12 || col < 0 || col > 12) return;

    const state = engine.getState();

    if (state.diceValue === 0) {
      return;
    }

    if (state.selectedPiece) {
      const targetPiece = engine.getPieceAt(row, col);
      if (targetPiece && targetPiece.player === currentTurn) {
        engine.selectPiece(row, col);
        renderGame();
        return;
      }

      if (engine.movePiece(row, col)) {
        renderGame();
        
        const newState = engine.getState();
        setCurrentTurn(newState.currentPlayer);
        setDiceValue(0);
        setMessage('回合结束');

        if (newState.isGameOver) {
          setGameStatus('gameover');
          setGameResult('红方获胜！');
          setBestScore(prev => Math.max(prev, 100));
        } else {
          setTimeout(() => {
            aiTurn();
          }, 500);
        }
      }
    } else {
      const clickedPiece = engine.getPieceAt(row, col);
      if (clickedPiece && clickedPiece.player === currentTurn) {
        engine.selectPiece(row, col);
        renderGame();
      }
    }
  }, [gameStatus, currentTurn, renderGame, setBestScore]);

  const aiTurn = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    setIsRolling(true);
    setMessage('AI投掷骰子...');

    setTimeout(() => {
      const value = engine.rollDice();
      setDiceValue(value);
      setIsRolling(false);
      renderGame();

      if (value === 6) {
        setTimeout(() => {
          aiMove();
        }, 500);
      } else {
        setTimeout(() => {
          aiMove();
        }, 800);
      }
    }, 1000);
  }, [renderGame]);

  const aiMove = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const state = engine.getState();
    
    if (state.validMoves.length === 0) {
      setMessage('AI无法移动，跳过回合');
      setTimeout(() => {
        const newState = engine.getState();
        setCurrentTurn(newState.currentPlayer);
        setDiceValue(0);
        setMessage('你的回合');
      }, 500);
      return;
    }

    const move = state.validMoves[Math.floor(Math.random() * state.validMoves.length)];
    const piece = engine.getPieceAt(move.row, move.col) || state.pieces.find(p => p.player === 'blue');

    if (piece) {
      engine.selectPiece(piece.row, piece.col);
      renderGame();

      setTimeout(() => {
        engine.movePiece(move.row, move.col);
        renderGame();

        const newState = engine.getState();
        setCurrentTurn(newState.currentPlayer);
        setDiceValue(0);

        if (newState.isGameOver) {
          setGameStatus('gameover');
          setGameResult('蓝方获胜！');
        } else {
          setMessage('你的回合，点击骰子投掷');
        }
      }, 500);
    }
  }, [renderGame]);

  const handleRollDice = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || gameStatus !== 'playing') return;
    if (currentTurn !== 'red') return;

    const state = engine.getState();
    if (state.diceValue !== 0) return;

    setIsRolling(true);
    setMessage('投掷中...');

    setTimeout(() => {
      const value = engine.rollDice();
      setDiceValue(value);
      setIsRolling(false);
      setMessage(`掷出 ${value} 点`);
      renderGame();

      if (value === 6) {
        setMessage('再投一次！');
      }
    }, 500);
  }, [gameStatus, currentTurn, renderGame]);

  useEffect(() => {
    engineRef.current = new HopChessEngine();

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
    setCurrentTurn('red');
    setDiceValue(0);
    setGameResult('');
    setMessage('你的回合，点击骰子投掷');
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
            跳棋
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
            {gameStatus === 'playing' && currentTurn === 'red' && message}
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
                  跳棋
                </h2>
                <p className="text-lg mb-8 opacity-70" style={{ color: NEON_COLORS.white }}>
                  与AI对弈，将棋子跳入对方基地获胜
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
                <div className="text-2xl mb-8" style={{ color: NEON_COLORS.gold }}>
                  本局得分: 100
                </div>
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

        <div className="flex items-center justify-center mt-6 gap-4">
          <motion.div
            className="w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-4xl"
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(108, 92, 231, 0.5)',
              color: NEON_COLORS.gold,
              boxShadow: `0 0 20px ${NEON_COLORS.gold}40`
            }}
            animate={isRolling ? { rotate: 360 } : {}}
            transition={isRolling ? { duration: 0.5, ease: 'easeInOut' } : {}}
          >
            {diceValue > 0 ? diceValue : '?'}
          </motion.div>

          {gameStatus === 'playing' && currentTurn === 'red' && diceValue === 0 && (
            <motion.button
              onClick={handleRollDice}
              className="px-6 py-3 rounded-xl font-bold text-lg"
              style={{
                backgroundColor: '#dc2626',
                color: NEON_COLORS.white,
                boxShadow: `0 0 20px #dc262680`
              }}
              whileHover={{ scale: 1.05, boxShadow: `0 0 40px #dc2626` }}
              whileTap={{ scale: 0.95 }}
            >
              投掷骰子
            </motion.button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-center text-sm opacity-60" style={{ color: NEON_COLORS.gold }}>
          <div>
            <div className="font-semibold mb-1">游戏规则</div>
            <div>红方先手，投掷骰子移动</div>
          </div>
          <div>
            <div className="font-semibold mb-1">获胜条件</div>
            <div>将所有棋子移入对方基地</div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs opacity-40" style={{ color: NEON_COLORS.gold }}>
          提示：点击骰子投掷，然后点击棋子移动到绿色标记位置
        </div>
      </motion.div>
    </div>
  );
}
