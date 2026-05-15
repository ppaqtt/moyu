import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MusicFighterEngine, FighterNote } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { useGameLoop } from '../../hooks/useGameLoop';

const engine = new MusicFighterEngine();

interface FeedbackEffect {
  text: string;
  color: string;
  time: number;
}

export default function MusicFighter() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [enemyHealth, setEnemyHealth] = useState(100);
  const [notes, setNotes] = useState<FighterNote[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEffect | null>(null);
  const [currentAttack, setCurrentAttack] = useState<'none' | 'punch' | 'kick'>('none');
  const [enemyState, setEnemyState] = useState<'idle' | 'attacking' | 'hurt' | 'dizzy'>('idle');
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const canvasSize = engine.getCanvasSize();
  const hitLineY = engine.getHitLineY();

  const handleGameLoop = useCallback((deltaTime: number) => {
    engine.tick(deltaTime);
    const state = engine.getState();

    setScore(state.playerScore);
    setCombo(state.combo);
    setMaxCombo(state.maxCombo);
    setPlayerHealth(state.playerHealth);
    setEnemyHealth(state.enemyHealth);
    setNotes([...state.notes]);
    setCurrentAttack(state.currentAttack);
    setEnemyState(state.enemyState);

    if (state.isGameOver && gameState === 'playing') {
      setWinner(state.winner);
      setGameState('gameover');
    }
  }, [gameState]);

  useGameLoop(handleGameLoop, gameState === 'playing');

  const startGame = useCallback(() => {
    engine.start();
    setGameState('playing');
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setPlayerHealth(100);
    setEnemyHealth(100);
    setNotes([]);
    setFeedback(null);
    setCurrentAttack('none');
    setEnemyState('idle');
    setWinner(null);
  }, []);

  const handleAttack = useCallback((type: 'punch' | 'kick') => {
    if (gameState !== 'playing') return;
    const result = engine.handleTap(type);

    const colorMap: Record<string, string> = {
      perfect: NEON_COLORS.perfect,
      great: NEON_COLORS.great,
      good: NEON_COLORS.good,
      miss: NEON_COLORS.miss,
    };
    const textMap: Record<string, string> = {
      perfect: 'PERFECT!',
      great: 'GREAT!',
      good: 'GOOD!',
      miss: 'MISS!',
    };

    setFeedback({ text: textMap[result.result], color: colorMap[result.result], time: Date.now() });

    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
    }, 400);
  }, [gameState]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState !== 'playing') return;

    if (e.key === 'j' || e.key === 'J') {
      handleAttack('punch');
    } else if (e.key === 'k' || e.key === 'K') {
      handleAttack('kick');
    }
  }, [gameState, handleAttack]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);

  const renderMenu = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-8xl mb-6"
      >
        👊
      </motion.div>
      <h1 className="text-5xl font-bold mb-2" style={{
        color: NEON_COLORS.danger,
        textShadow: `0 0 30px ${NEON_COLORS.danger}, 0 0 60px ${NEON_COLORS.danger}`
      }}>
        MusicFighter
      </h1>
      <h2 className="text-2xl mb-4" style={{ color: NEON_COLORS.warning }}>
        音乐格斗
      </h2>
      <p className="text-lg mb-8 opacity-80">跟节拍打拳，击败对手!</p>

      <div className="mb-8 text-center">
        <div className="text-sm opacity-70 mb-4">操作说明</div>
        <div className="flex gap-8">
          <div className="glass-card rounded-lg px-6 py-4 text-center">
            <div className="text-3xl mb-2">👊</div>
            <div className="text-lg font-bold mb-1">J 键</div>
            <div className="text-sm opacity-70">出拳</div>
          </div>
          <div className="glass-card rounded-lg px-6 py-4 text-center">
            <div className="text-3xl mb-2">🦵</div>
            <div className="text-lg font-bold mb-1">K 键</div>
            <div className="text-sm opacity-70">踢腿</div>
          </div>
        </div>
      </div>

      <motion.button
        onClick={startGame}
        className="px-12 py-4 rounded-xl text-xl font-bold mb-4"
        style={{
          background: `linear-gradient(135deg, ${NEON_COLORS.danger}, ${NEON_COLORS.warning})`,
          boxShadow: `0 0 30px ${NEON_COLORS.danger}80`,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        开始战斗
      </motion.button>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-2 rounded-lg text-base"
        style={{
          background: 'transparent',
          border: `2px solid ${NEON_COLORS.textDim}`,
          color: NEON_COLORS.textDim,
        }}
      >
        返回主页
      </button>
    </motion.div>
  );

  const renderGame = () => {
    const playerHealthColor = playerHealth > 50 ? NEON_COLORS.success : playerHealth > 25 ? NEON_COLORS.warning : NEON_COLORS.danger;
    const enemyHealthColor = enemyHealth > 50 ? NEON_COLORS.success : enemyHealth > 25 ? NEON_COLORS.warning : NEON_COLORS.danger;

    return (
      <div className="relative" style={{ width: canvasSize.width, height: canvasSize.height }}>
        <div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{
            background: `linear-gradient(180deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)`,
            boxShadow: `0 0 40px ${NEON_COLORS.danger}40`,
          }}
        >
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <div className="glass-card rounded-lg px-3 py-2">
              <div className="text-xs opacity-70">分数</div>
              <div className="text-xl font-bold" style={{ color: NEON_COLORS.primary }}>{score}</div>
            </div>
            <div className="glass-card rounded-lg px-3 py-2">
              <div className="text-xs opacity-70">连击</div>
              <div className="text-xl font-bold" style={{ color: combo > 10 ? NEON_COLORS.gold : NEON_COLORS.text }}>
                {combo}x
              </div>
            </div>
          </div>

          <div className="absolute top-20 left-4 right-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm" style={{ color: NEON_COLORS.neonPink }}>玩家</span>
              <span className="text-sm font-bold" style={{ color: playerHealthColor }}>{Math.max(0, playerHealth)}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: NEON_COLORS.surface }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: playerHealthColor }}
                animate={{ width: `${Math.max(0, playerHealth)}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>

          <div className="absolute top-32 left-4 right-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm" style={{ color: NEON_COLORS.neonCyan }}>敌人</span>
              <span className="text-sm font-bold" style={{ color: enemyHealthColor }}>{Math.max(0, enemyHealth)}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: NEON_COLORS.surface }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: enemyHealthColor }}
                animate={{ width: `${Math.max(0, enemyHealth)}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>

          <div className="absolute top-44 left-0 right-0 flex justify-center">
            <motion.div
              className="relative"
              animate={{
                scale: enemyState === 'hurt' ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-6xl">
                {enemyState === 'hurt' ? '😵' : enemyState === 'attacking' ? '😠' : '🤖'}
              </div>
              {enemyState === 'hurt' && (
                <motion.div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl font-bold"
                  style={{ color: NEON_COLORS.danger }}
                  animate={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  -8
                </motion.div>
              )}
            </motion.div>
          </div>

          <div className="absolute bottom-32 left-1/2 -translate-x-1/2">
            <motion.div
              className="text-6xl"
              animate={{
                scale: currentAttack === 'punch' ? [1, 1.2, 1] : currentAttack === 'kick' ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 0.15 }}
            >
              {currentAttack === 'punch' ? '👊' : currentAttack === 'kick' ? '🦵' : '🧍'}
            </motion.div>
          </div>

          <div
            className="absolute left-0 right-0 h-1"
            style={{
              top: hitLineY,
              background: `linear-gradient(90deg, ${NEON_COLORS.danger}, ${NEON_COLORS.warning})`,
              boxShadow: `0 0 20px ${NEON_COLORS.danger}`,
            }}
          />

          <AnimatePresence>
            {notes.filter(n => !n.hit).map(note => (
              <motion.div
                key={note.id}
                className="absolute left-1/2 -translate-x-1/2 rounded-lg cursor-pointer flex items-center justify-center font-bold"
                style={{
                  top: note.y,
                  width: 120,
                  height: 50,
                  background: note.type === 'punch'
                    ? `linear-gradient(135deg, ${NEON_COLORS.danger}, ${NEON_COLORS.warning})`
                    : `linear-gradient(135deg, ${NEON_COLORS.neonBlue}, ${NEON_COLORS.neonCyan})`,
                  boxShadow: note.type === 'punch'
                    ? `0 0 20px ${NEON_COLORS.danger}`
                    : `0 0 20px ${NEON_COLORS.neonBlue}`,
                }}
                onClick={() => handleAttack(note.type)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="text-white text-xl" style={{ textShadow: `0 0 10px ${NEON_COLORS.white}` }}>
                  {note.type === 'punch' ? '👊 拳' : '🦵 腿'}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {feedback && (
              <motion.div
                className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 text-4xl font-bold pointer-events-none"
                style={{
                  color: feedback.color,
                  textShadow: `0 0 30px ${feedback.color}`,
                }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {feedback.text}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute bottom-0 left-0 right-0 h-28 flex">
            <motion.button
              className="flex-1 flex flex-col items-center justify-center text-2xl font-bold border-t-2 border-r border-gray-700"
              style={{
                background: `${NEON_COLORS.danger}30`,
                borderColor: `${NEON_COLORS.danger}60`,
                color: NEON_COLORS.danger,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95, backgroundColor: `${NEON_COLORS.danger}60` }}
              onClick={() => handleAttack('punch')}
            >
              <span className="text-4xl mb-1">👊</span>
              <span className="text-sm">J 键</span>
            </motion.button>
            <motion.button
              className="flex-1 flex flex-col items-center justify-center text-2xl font-bold border-t-2 border-l border-gray-700"
              style={{
                background: `${NEON_COLORS.neonBlue}30`,
                borderColor: `${NEON_COLORS.neonBlue}60`,
                color: NEON_COLORS.neonBlue,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95, backgroundColor: `${NEON_COLORS.neonBlue}60` }}
              onClick={() => handleAttack('kick')}
            >
              <span className="text-4xl mb-1">🦵</span>
              <span className="text-sm">K 键</span>
            </motion.button>
          </div>
        </div>
      </div>
    );
  };

  const renderGameOver = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <div className="text-6xl mb-4">
        {winner === 'player' ? '🏆' : '💀'}
      </div>
      <h1 className="text-4xl font-bold mb-6" style={{
        color: winner === 'player' ? NEON_COLORS.gold : NEON_COLORS.danger
      }}>
        {winner === 'player' ? '你赢了!' : '你输了!'}
      </h1>

      <div className="glass-card rounded-xl p-6 mb-6" style={{ minWidth: 300 }}>
        <div className="text-3xl font-bold mb-4 text-center" style={{ color: NEON_COLORS.primary }}>
          最终得分: {score}
        </div>
        <div className="flex justify-between mb-2">
          <span>最大连击:</span>
          <span style={{ color: NEON_COLORS.gold }}>{maxCombo}x</span>
        </div>
        <div className="flex justify-between">
          <span>胜利状态:</span>
          <span style={{ color: winner === 'player' ? NEON_COLORS.success : NEON_COLORS.danger }}>
            {winner === 'player' ? 'KO对手' : '被KO'}
          </span>
        </div>
      </div>

      <motion.button
        onClick={startGame}
        className="px-10 py-3 rounded-xl text-lg font-bold mb-3"
        style={{
          background: `linear-gradient(135deg, ${NEON_COLORS.danger}, ${NEON_COLORS.warning})`,
          boxShadow: `0 0 30px ${NEON_COLORS.danger}50`,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        再来一局
      </motion.button>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-2 rounded-lg"
        style={{
          background: 'transparent',
          border: `2px solid ${NEON_COLORS.textDim}`,
          color: NEON_COLORS.textDim,
        }}
      >
        返回主页
      </button>
    </motion.div>
  );

  return (
    <div className="flex flex-col items-center p-4 min-h-screen" style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #1a0a0a 100%)` }}>
      <style>{`
        .glass-card {
          background: ${NEON_COLORS.surface}cc;
          backdrop-filter: blur(10px);
          border: 1px solid ${NEON_COLORS.primary}30;
        }
      `}</style>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'gameover' && renderGameOver()}
    </div>
  );
}
