import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BeatMasterEngine, Beat } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { useGameLoop } from '../../hooks/useGameLoop';

const engine = new BeatMasterEngine();

interface FeedbackEffect {
  text: string;
  color: string;
  time: number;
}

const LANE_KEYS = ['1', '2', '3', '4', '5', '6'];

export default function BeatMaster() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [stats, setStats] = useState({ perfect: 0, great: 0, good: 0, miss: 0 });
  const [notes, setNotes] = useState<Beat[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEffect | null>(null);
  const [songProgress, setSongProgress] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const feedbackTimerRef = useRef<number | null>(null);
  const canvasSize = engine.getCanvasSize();
  const hitLineY = engine.getHitLineY();
  const laneWidth = engine.getLaneWidth();

  const handleGameLoop = useCallback((deltaTime: number) => {
    engine.tick(deltaTime);
    const state = engine.getState();
    setScore(state.score);
    setCombo(state.combo);
    setMaxCombo(state.maxCombo);
    setAccuracy(engine.getAccuracy());
    setStats({
      perfect: state.perfectCount,
      great: state.greatCount,
      good: state.goodCount,
      miss: state.missCount,
    });
    setNotes([...state.notes]);
    setSongProgress(state.songProgress);
    setMultiplier(Math.min(state.multiplier, 3));

    if (state.isGameOver && gameState === 'playing') {
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
    setAccuracy(100);
    setStats({ perfect: 0, great: 0, good: 0, miss: 0 });
    setNotes([]);
    setFeedback(null);
    setSongProgress(0);
    setMultiplier(1);
  }, []);

  const handleTap = useCallback((lane: number) => {
    if (gameState !== 'playing') return;
    const result = engine.handleTap(lane);
    
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
    const keyIndex = LANE_KEYS.indexOf(e.key.toLowerCase());
    if (keyIndex !== -1) {
      handleTap(keyIndex);
    }
  }, [gameState, handleTap]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
        🎵
      </motion.div>
      <h1 className="text-5xl font-bold mb-2" style={{ 
        color: NEON_COLORS.primary,
        textShadow: `0 0 30px ${NEON_COLORS.primary}, 0 0 60px ${NEON_COLORS.primary}`
      }}>
        BeatMaster
      </h1>
      <h2 className="text-2xl mb-12" style={{ color: NEON_COLORS.secondary }}>
        节拍大师
      </h2>
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
        开始游戏
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
      <div className="mt-8 text-center opacity-60">
        <p className="mb-2">操作说明</p>
        <p className="text-sm">按键: 1-6 或 对应颜色按钮</p>
        <p className="text-sm">在节拍到达底线时按下对应键</p>
      </div>
    </motion.div>
  );

  const renderGame = () => (
    <div className="relative" style={{ width: canvasSize.width }}>
      <div
        className="rounded-xl overflow-hidden"
        style={{
          height: canvasSize.height,
          background: `linear-gradient(180deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)`,
          boxShadow: `0 0 40px ${NEON_COLORS.primary}40`,
        }}
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0"
            style={{
              left: i * laneWidth,
              width: laneWidth,
              background: `linear-gradient(180deg, transparent 0%, ${NEON_COLORS.primary}08 50%, ${NEON_COLORS.primary}15 100%)`,
              borderLeft: i > 0 ? `1px solid ${NEON_COLORS.primary}20` : 'none',
            }}
          />
        ))}

        <motion.div
          className="absolute left-0 right-0 h-1"
          style={{
            top: hitLineY,
            background: `linear-gradient(90deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary}, ${NEON_COLORS.primary})`,
            boxShadow: `0 0 20px ${NEON_COLORS.primary}, 0 0 40px ${NEON_COLORS.primary}`,
          }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 0.5, repeat: Infinity }}
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
                height: note.type === 'hold' ? 80 : 50,
                background: `linear-gradient(135deg, ${getLaneColor(note.lane)}, ${getLaneColor(note.lane)}aa)`,
                boxShadow: `0 0 20px ${getLaneColor(note.lane)}, inset 0 0 10px rgba(255,255,255,0.3)`,
                border: `2px solid ${getLaneColor(note.lane)}`,
              }}
              onClick={() => handleTap(note.lane)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-white text-lg" style={{ textShadow: `0 0 10px ${NEON_COLORS.white}` }}>
                {LANE_KEYS[note.lane]}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {notes.filter(n => n.hit && n.hitTime && Date.now() - n.hitTime < 300).map(note => (
            <motion.div
              key={`hit-${note.id}`}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: note.lane * laneWidth,
                top: hitLineY - 60,
                width: laneWidth,
                height: 120,
                background: `radial-gradient(ellipse at center, ${getHitColor(note.timing)}60 0%, transparent 70%)`,
              }}
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </AnimatePresence>

        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <div className="glass-card rounded-lg px-3 py-1">
            <div className="text-xs opacity-70">分数</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.primary }}>{score}</div>
          </div>
          <div className="glass-card rounded-lg px-3 py-1">
            <div className="text-xs opacity-70">连击</div>
            <div className="text-xl font-bold" style={{ color: combo > 10 ? NEON_COLORS.gold : NEON_COLORS.text }}>
              {combo} <span className="text-sm">x{multiplier.toFixed(1)}</span>
            </div>
          </div>
          <div className="glass-card rounded-lg px-3 py-1">
            <div className="text-xs opacity-70">准确</div>
            <div className="text-xl font-bold" style={{ color: accuracy > 80 ? NEON_COLORS.success : accuracy > 50 ? NEON_COLORS.gold : NEON_COLORS.danger }}>
              {accuracy}%
            </div>
          </div>
        </div>

        <div className="absolute top-16 left-3 right-3">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: `${NEON_COLORS.surface}` }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})` }}
              animate={{ width: `${Math.min((songProgress / 60) * 100, 100)}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div
              className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 text-4xl font-bold pointer-events-none"
              style={{
                color: feedback.color,
                textShadow: `0 0 30px ${feedback.color}, 0 0 60px ${feedback.color}`,
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

        <div className="absolute bottom-0 left-0 right-0 h-24 flex">
          {[...Array(6)].map((_, i) => (
            <motion.button
              key={i}
              className="flex-1 flex items-center justify-center text-2xl font-bold border-t-2"
              style={{
                background: `${getLaneColor(i)}30`,
                borderColor: `${getLaneColor(i)}60`,
                color: getLaneColor(i),
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95, backgroundColor: `${getLaneColor(i)}60` }}
              onClick={() => handleTap(i)}
            >
              {LANE_KEYS[i]}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-4">
        <div className="glass-card rounded-lg px-4 py-2">
          <span style={{ color: NEON_COLORS.perfect }}>完美: {stats.perfect}</span>
        </div>
        <div className="glass-card rounded-lg px-4 py-2">
          <span style={{ color: NEON_COLORS.great }}>很好: {stats.great}</span>
        </div>
        <div className="glass-card rounded-lg px-4 py-2">
          <span style={{ color: NEON_COLORS.good }}>好: {stats.good}</span>
        </div>
        <div className="glass-card rounded-lg px-4 py-2">
          <span style={{ color: NEON_COLORS.miss }}>失误: {stats.miss}</span>
        </div>
      </div>
    </div>
  );

  const renderGameOver = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <div className="text-6xl mb-4">🎵</div>
      <h1 className="text-4xl font-bold mb-6" style={{ color: NEON_COLORS.danger }}>
        游戏结束
      </h1>
      <div className="glass-card rounded-xl p-6 mb-6" style={{ minWidth: 300 }}>
        <div className="text-3xl font-bold mb-4 text-center" style={{ color: NEON_COLORS.gold }}>
          最终得分: {score}
        </div>
        <div className="flex justify-between mb-2">
          <span>最大连击:</span>
          <span style={{ color: NEON_COLORS.primary }}>{maxCombo}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>准确率:</span>
          <span style={{ color: accuracy > 80 ? NEON_COLORS.success : NEON_COLORS.gold }}>{accuracy}%</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>完美:</span>
          <span style={{ color: NEON_COLORS.perfect }}>{stats.perfect}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>很好:</span>
          <span style={{ color: NEON_COLORS.great }}>{stats.great}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>好:</span>
          <span style={{ color: NEON_COLORS.good }}>{stats.good}</span>
        </div>
        <div className="flex justify-between">
          <span>失误:</span>
          <span style={{ color: NEON_COLORS.miss }}>{stats.miss}</span>
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

function getLaneColor(lane: number): string {
  const colors = [
    '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'
  ];
  return colors[lane % colors.length];
}

function getHitColor(timing?: string): string {
  const colors: Record<string, string> = {
    perfect: NEON_COLORS.perfect,
    great: NEON_COLORS.great,
    good: NEON_COLORS.good,
    miss: NEON_COLORS.miss,
  };
  return colors[timing || 'miss'];
}
