import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BeatBattleEngine, Player } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { useGameLoop } from '../../hooks/useGameLoop';

const engine = new BeatBattleEngine();

const PLAYER1_KEYS = ['1', '2', '3'];
const PLAYER2_KEYS = ['7', '8', '9'];

interface FeedbackEffect {
  text: string;
  color: string;
  time: number;
  playerId: number;
}

export default function BeatBattle() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [p1Combo, setP1Combo] = useState(0);
  const [p2Combo, setP2Combo] = useState(0);
  const [p1Health, setP1Health] = useState(100);
  const [p2Health, setP2Health] = useState(100);
  const [p1Notes, setP1Notes] = useState<Player[]>([]);
  const [p2Notes, setP2Notes] = useState<Player[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEffect | null>(null);
  const [gameTime, setGameTime] = useState(120);
  const [winner, setWinner] = useState<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const canvasSize = engine.getCanvasSize();
  const hitLineY = engine.getHitLineY();
  const laneWidth = engine.getLaneWidth();

  const handleGameLoop = useCallback((deltaTime: number) => {
    engine.tick(deltaTime);
    const state = engine.getState();

    setP1Score(state.player1.score);
    setP2Score(state.player2.score);
    setP1Combo(state.player1.combo);
    setP2Combo(state.player2.combo);
    setP1Health(state.player1.health);
    setP2Health(state.player2.health);
    setP1Notes([...state.player1.notes]);
    setP2Notes([...state.player2.notes]);
    setGameTime(Math.max(0, Math.ceil((120000 - state.gameTime) / 1000)));

    if (state.isGameOver && gameState === 'playing') {
      setWinner(state.winner);
      setGameState('gameover');
    }
  }, [gameState]);

  useGameLoop(handleGameLoop, gameState === 'playing');

  const startGame = useCallback(() => {
    engine.start();
    setGameState('playing');
    setP1Score(0);
    setP2Score(0);
    setP1Combo(0);
    setP2Combo(0);
    setP1Health(100);
    setP2Health(100);
    setP1Notes([]);
    setP2Notes([]);
    setFeedback(null);
    setGameTime(120);
    setWinner(null);
  }, []);

  const handleTap = useCallback((playerId: number, lane: number) => {
    if (gameState !== 'playing') return;
    const result = engine.handleTap(playerId, lane);

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

    setFeedback({ text: textMap[result.result], color: colorMap[result.result], time: Date.now(), playerId });

    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
    }, 400);
  }, [gameState]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState !== 'playing') return;

    const p1Index = PLAYER1_KEYS.indexOf(e.key);
    if (p1Index !== -1) {
      handleTap(1, p1Index);
      return;
    }

    const p2Index = PLAYER2_KEYS.indexOf(e.key);
    if (p2Index !== -1) {
      handleTap(2, 3 + p2Index);
      return;
    }
  }, [gameState, handleTap]);

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
        ⚔️
      </motion.div>
      <h1 className="text-5xl font-bold mb-2" style={{
        color: NEON_COLORS.primary,
        textShadow: `0 0 30px ${NEON_COLORS.primary}, 0 0 60px ${NEON_COLORS.primary}`
      }}>
        BeatBattle
      </h1>
      <h2 className="text-2xl mb-4" style={{ color: NEON_COLORS.secondary }}>
        节拍对战
      </h2>
      <p className="text-lg mb-8 opacity-80">双人节奏PK，跟节拍竞技</p>

      <div className="flex gap-8 mb-8">
        <div className="text-center">
          <div className="text-3xl mb-2" style={{ color: NEON_COLORS.neonPink }}>P1</div>
          <div className="text-sm opacity-70">玩家1</div>
          <div className="text-xs opacity-50 mt-1">按键: 1, 2, 3</div>
        </div>
        <div className="text-4xl opacity-50">VS</div>
        <div className="text-center">
          <div className="text-3xl mb-2" style={{ color: NEON_COLORS.neonCyan }}>P2</div>
          <div className="text-sm opacity-70">玩家2</div>
          <div className="text-xs opacity-50 mt-1">按键: 7, 8, 9</div>
        </div>
      </div>

      <motion.button
        onClick={startGame}
        className="px-12 py-4 rounded-xl text-xl font-bold mb-4"
        style={{
          background: `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
          boxShadow: `0 0 30px ${NEON_COLORS.primary}80`,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        开始对战
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

  const renderPlayerArea = (playerId: number, notes: Player[], keys: string[], health: number, score: number, combo: number, offsetX: number) => {
    const healthColor = health > 50 ? NEON_COLORS.success : health > 25 ? NEON_COLORS.warning : NEON_COLORS.danger;
    const playerColor = playerId === 1 ? NEON_COLORS.neonPink : NEON_COLORS.neonCyan;

    return (
      <div
        className="relative flex-1"
        style={{
          background: `linear-gradient(180deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)`,
          borderLeft: playerId === 1 ? 'none' : '2px solid ' + NEON_COLORS.primary + '40',
          borderRight: playerId === 1 ? '2px solid ' + NEON_COLORS.primary + '40' : 'none',
        }}
      >
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10">
          <div className="text-lg font-bold" style={{ color: playerColor }}>
            P{playerId}
          </div>
          <div className="text-2xl font-bold" style={{ color: playerColor }}>
            {score}
          </div>
        </div>

        <div className="absolute top-12 left-2 right-2">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: NEON_COLORS.surface }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: healthColor }}
              animate={{ width: `${Math.max(0, health)}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div className="text-xs text-right mt-1" style={{ color: healthColor }}>
            {Math.max(0, health)} HP
          </div>
        </div>

        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="absolute top-0 bottom-0"
            style={{
              left: (playerId === 1 ? i : 3 + i) * laneWidth,
              width: laneWidth,
              background: `linear-gradient(180deg, transparent 0%, ${playerColor}08 50%, ${playerColor}15 100%)`,
              borderLeft: i > 0 ? `1px solid ${playerColor}20` : 'none',
            }}
          />
        ))}

        <div
          className="absolute left-0 right-0 h-1"
          style={{
            top: hitLineY,
            background: `linear-gradient(90deg, ${playerColor}, ${playerColor}aa)`,
            boxShadow: `0 0 15px ${playerColor}`,
          }}
        />

        <AnimatePresence>
          {notes.filter(n => !n.hit).map(note => (
            <motion.div
              key={note.id}
              className="absolute rounded-lg cursor-pointer flex items-center justify-center font-bold"
              style={{
                left: note.lane * laneWidth + 8,
                top: note.y,
                width: laneWidth - 16,
                height: 45,
                background: `linear-gradient(135deg, ${playerColor}, ${playerColor}aa)`,
                boxShadow: `0 0 15px ${playerColor}`,
                border: `2px solid ${playerColor}`,
              }}
              onClick={() => handleTap(playerId, note.lane)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-white text-lg" style={{ textShadow: `0 0 10px ${NEON_COLORS.white}` }}>
                {keys[note.lane - (playerId === 1 ? 0 : 3)]}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="absolute bottom-0 left-0 right-0 h-20 flex">
          {[0, 1, 2].map(i => (
            <motion.button
              key={i}
              className="flex-1 flex items-center justify-center text-xl font-bold border-t-2"
              style={{
                background: `${playerColor}30`,
                borderColor: `${playerColor}60`,
                color: playerColor,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95, backgroundColor: `${playerColor}60` }}
              onClick={() => handleTap(playerId, playerId === 1 ? i : 3 + i)}
            >
              {keys[i]}
            </motion.button>
          ))}
        </div>

        <div className="absolute bottom-24 left-2 text-sm font-bold" style={{ color: combo > 10 ? NEON_COLORS.gold : NEON_COLORS.text }}>
          {combo > 0 && `${combo}x COMBO`}
        </div>
      </div>
    );
  };

  const renderGame = () => (
    <div className="relative flex" style={{ width: canvasSize.width }}>
      {renderPlayerArea(1, p1Notes, PLAYER1_KEYS, p1Health, p1Score, p1Combo, 0)}

      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
        <div className="glass-card rounded-lg px-4 py-2 text-center">
          <div className="text-2xl font-bold" style={{ color: NEON_COLORS.gold }}>
            {gameTime}s
          </div>
        </div>
      </div>

      {feedback && (
        <motion.div
          className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 text-3xl font-bold pointer-events-none z-30"
          style={{
            color: feedback.color,
            textShadow: `0 0 20px ${feedback.color}`,
            left: feedback.playerId === 1 ? '25%' : '75%',
          }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {feedback.text}
        </motion.div>
      )}
    </div>
  );

  const renderGameOver = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <div className="text-6xl mb-4">🏆</div>
      <h1 className="text-4xl font-bold mb-6" style={{ color: NEON_COLORS.gold }}>
        {winner === 0 ? '平局!' : `玩家${winner}获胜!`}
      </h1>

      <div className="flex gap-8 mb-6">
        <div className="glass-card rounded-xl p-6 text-center" style={{ minWidth: 150 }}>
          <div className="text-2xl font-bold mb-2" style={{ color: NEON_COLORS.neonPink }}>P1</div>
          <div className="text-3xl font-bold mb-2">{p1Score}</div>
          <div className="text-sm opacity-70">分数</div>
          <div className="mt-2 text-sm">
            <span style={{ color: NEON_COLORS.perfect }}>P: {Math.round(p1Score / 100)}</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6 text-center" style={{ minWidth: 150 }}>
          <div className="text-2xl font-bold mb-2" style={{ color: NEON_COLORS.neonCyan }}>P2</div>
          <div className="text-3xl font-bold mb-2">{p2Score}</div>
          <div className="text-sm opacity-70">分数</div>
          <div className="mt-2 text-sm">
            <span style={{ color: NEON_COLORS.perfect }}>P: {Math.round(p2Score / 100)}</span>
          </div>
        </div>
      </div>

      <motion.button
        onClick={startGame}
        className="px-10 py-3 rounded-xl text-lg font-bold mb-3"
        style={{
          background: `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
          boxShadow: `0 0 30px ${NEON_COLORS.primary}50`,
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
    <div className="flex flex-col items-center p-4 min-h-screen" style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #16162a 100%)` }}>
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
