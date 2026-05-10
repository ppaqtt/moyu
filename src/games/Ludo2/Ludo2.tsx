import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { LUDO2_CONSTANTS, NEON_COLORS } from '../../utils/constants';
import { Ludo2Engine, Ludo2State, PLAYER_COLORS } from './engine';

const { CANVAS_WIDTH, CANVAS_HEIGHT } = LUDO2_CONSTANTS;

type GameStatus = 'idle' | 'playing' | 'selecting' | 'moving' | 'gameover';

const PLAYER_NAMES: Record<number, string> = {
  0: '红方',
  1: '蓝方',
  2: '绿方',
  3: '黄方'
};

const PLAYER_ICONS: Record<number, string> = {
  0: '🔴',
  1: '🔵',
  2: '🟢',
  3: '🟡'
};

export default function Ludo2() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Ludo2Engine | null>(null);
  const animFrameRef = useRef<number>(0);

  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [diceValue, setDiceValue] = useState(0);
  const [message, setMessage] = useState('点击开始游戏');
  const [winner, setWinner] = useState<number | null>(null);
  const [highScore, setHighScore] = useLocalStorage<number>('ludo2_highscore', 0);
  const [isRolling, setIsRolling] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    engineRef.current = new Ludo2Engine(4);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.draw(ctx);
  }, []);

  const gameLoop = useCallback(() => {
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    if (!engine || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = engine.getState();

    setCurrentPlayer(state.currentPlayer);
    setDiceValue(state.diceValue);
    setMessage(state.message);
    setWinner(state.winner);
    setGameStatus(state.gameStatus);

    if (state.diceValue === 6 && state.gameStatus === 'moving') {
      setTimeout(() => engine.finishMoving(), 500);
    } else if (state.gameStatus === 'moving') {
      setTimeout(() => engine.finishMoving(), 500);
    }

    draw(ctx);
    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [draw]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [gameLoop]);

  useEffect(() => {
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    if (!engine || !canvas) return;

    const handleClick = (e: MouseEvent) => {
      if (gameStatus !== 'selecting') return;
      if (engine.isAIsTurn()) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const pieceId = engine.getPieceAtPosition(x, y);
      if (pieceId !== null) {
        engine.selectPiece(pieceId);
      }
    };

    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [gameStatus]);

  const handleStart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  }, []);

  const handleRollDice = useCallback(() => {
    if (!engineRef.current) return;
    if (gameStatus !== 'playing') return;
    if (engineRef.current.isAIsTurn()) return;
    if (!engineRef.current.getState().canRollDice) return;

    setIsRolling(true);
    setTimeout(() => {
      engineRef.current?.rollDice();
      setIsRolling(false);
    }, 500);
  }, [gameStatus]);

  const handleRestart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
      engineRef.current.startGame();
    }
  }, []);

  const handleGoHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const getPlayerColorStyle = (playerId: number): React.CSSProperties => {
    const colors: Record<number, string> = {
      0: PLAYER_COLORS.red,
      1: PLAYER_COLORS.blue,
      2: PLAYER_COLORS.green,
      3: PLAYER_COLORS.yellow
    };
    return { color: colors[playerId] };
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0f0f23 100%)'
      }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-between w-full" style={{ maxWidth: CANVAS_WIDTH }}>
          <motion.button
            onClick={handleGoHome}
            className="px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300"
            style={{
              backgroundColor: NEON_COLORS.darkPurple,
              color: NEON_COLORS.neonBlue,
              boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}40`
            }}
            whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${NEON_COLORS.neonBlue}` }}
            whileTap={{ scale: 0.95 }}
          >
            ← 返回
          </motion.button>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>
                最高分
              </div>
              <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>
                {highScore}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full" style={{ maxWidth: CANVAS_WIDTH }}>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${PLAYER_COLORS.red}, ${PLAYER_COLORS.blue})`,
                width: '50%'
              }}
              animate={{ opacity: currentPlayer < 2 ? 1 : 0.3 }}
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: 'rgba(26, 26, 46, 0.8)', backdropFilter: 'blur(10px)' }}>
            <span style={{ fontSize: '24px' }}>{PLAYER_ICONS[currentPlayer]}</span>
            <span className="font-bold" style={getPlayerColorStyle(currentPlayer)}>
              {PLAYER_NAMES[currentPlayer]}
            </span>
          </div>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${PLAYER_COLORS.green}, ${PLAYER_COLORS.yellow})`,
                width: '50%'
              }}
              animate={{ opacity: currentPlayer >= 2 ? 1 : 0.3 }}
            />
          </div>
        </div>

        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(108, 92, 231, 0.3)',
            boxShadow: `0 0 30px ${NEON_COLORS.neonPurple}30, inset 0 0 50px rgba(0,0,0,0.5)`
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{ display: 'block' }}
          />

          <AnimatePresence>
            {gameStatus === 'idle' && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ backgroundColor: 'rgba(15, 15, 35, 0.9)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-5xl font-bold mb-3"
                  style={{
                    color: NEON_COLORS.neonPurple,
                    textShadow: `0 0 20px ${NEON_COLORS.neonPurple}`
                  }}
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  飞行棋2
                </motion.div>
                <motion.div
                  className="text-lg mb-8"
                  style={{ color: NEON_COLORS.neonCyan }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Ludo 2 - Enhanced Edition
                </motion.div>

                <motion.button
                  onClick={handleStart}
                  className="px-8 py-3 rounded-xl font-bold text-lg mb-6"
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.neonPurple}, ${NEON_COLORS.neonPink})`,
                    color: NEON_COLORS.white,
                    boxShadow: `0 0 25px ${NEON_COLORS.neonPurple}80`
                  }}
                  whileHover={{ scale: 1.08, boxShadow: `0 0 40px ${NEON_COLORS.neonPurple}` }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  开始游戏
                </motion.button>

                <motion.div
                  className="text-sm opacity-60 text-center leading-6"
                  style={{ color: NEON_COLORS.gold }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ delay: 0.7 }}
                >
                  <div>玩家 vs AI</div>
                  <div>特殊格子: 护盾|加速|炸弹|星星</div>
                  <div>掷到6点才能起飞</div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {gameStatus === 'gameover' && winner !== null && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ backgroundColor: 'rgba(15, 15, 35, 0.9)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-4xl font-bold mb-4"
                  style={{
                    color: winner === 0 ? PLAYER_COLORS.red : NEON_COLORS.neonPink,
                    textShadow: `0 0 20px ${winner === 0 ? PLAYER_COLORS.red : NEON_COLORS.neonPink}`
                  }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                >
                  {winner === 0 ? '🎉 恭喜获胜! 🎉' : 'AI获胜，再接再厉!'}
                </motion.div>

                <motion.div
                  className="text-lg mb-4"
                  style={{ color: NEON_COLORS.gold }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {PLAYER_ICONS[winner]} {PLAYER_NAMES[winner]}
                </motion.div>

                {winner === 0 && (
                  <motion.div
                    className="text-lg mb-4"
                    style={{ color: NEON_COLORS.neonGreen }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    新纪录!
                  </motion.div>
                )}

                <div className="flex gap-4 mt-4">
                  <motion.button
                    onClick={handleRestart}
                    className="px-6 py-3 rounded-lg font-bold"
                    style={{
                      backgroundColor: NEON_COLORS.neonPink,
                      color: NEON_COLORS.white,
                      boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    再来一局
                  </motion.button>
                  <motion.button
                    onClick={handleGoHome}
                    className="px-6 py-3 rounded-lg font-bold"
                    style={{
                      backgroundColor: NEON_COLORS.darkPurple,
                      color: NEON_COLORS.neonBlue,
                      border: `2px solid ${NEON_COLORS.neonBlue}`
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    返回首页
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-6">
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

          {gameStatus === 'playing' && currentPlayer === 0 && (
            <motion.button
              onClick={handleRollDice}
              className="px-8 py-4 rounded-xl font-bold text-lg"
              style={{
                background: `linear-gradient(135deg, ${PLAYER_COLORS.red}, ${NEON_COLORS.neonPurple})`,
                color: NEON_COLORS.white,
                boxShadow: `0 0 25px ${PLAYER_COLORS.red}80`
              }}
              whileHover={{ scale: 1.05, boxShadow: `0 0 40px ${PLAYER_COLORS.red}` }}
              whileTap={{ scale: 0.95 }}
              animate={{ opacity: 1 }}
            >
              掷骰子
            </motion.button>
          )}

          {gameStatus === 'selecting' && currentPlayer === 0 && (
            <motion.div
              className="px-6 py-3 rounded-xl font-bold"
              style={{
                backgroundColor: NEON_COLORS.neonGreen + '30',
                color: NEON_COLORS.neonGreen,
                border: `2px solid ${NEON_COLORS.neonGreen}`
              }}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              点击棋子移动
            </motion.div>
          )}

          {(gameStatus === 'playing' || gameStatus === 'selecting') && currentPlayer !== 0 && (
            <motion.div
              className="px-6 py-3 rounded-xl font-bold"
              style={{
                backgroundColor: NEON_COLORS.neonPurple + '30',
                color: NEON_COLORS.neonCyan
              }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              AI 思考中...
            </motion.div>
          )}
        </div>

        <div
          className="text-center px-6 py-3 rounded-xl"
          style={{
            backgroundColor: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(108, 92, 231, 0.3)',
            maxWidth: CANVAS_WIDTH
          }}
        >
          <div className="text-sm font-bold" style={{ color: NEON_COLORS.gold }}>
            {message}
          </div>
        </div>

        <div
          className="glass-card rounded-xl px-6 py-4 text-center"
          style={{
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(108, 92, 231, 0.3)',
            maxWidth: CANVAS_WIDTH,
            width: '100%'
          }}
        >
          <div className="flex justify-center gap-6 text-sm" style={{ color: NEON_COLORS.gold }}>
            <div className="flex items-center gap-2">
              <span style={{ color: '#00ffff' }}>🛡️</span>
              <span>护盾</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: '#ffff00' }}>⚡</span>
              <span>加速</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: '#ff4444' }}>💣</span>
              <span>炸弹</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: '#ffd700' }}>⭐</span>
              <span>星星</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
