import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DrumSimulatorEngine, DrumHit, DRUM_NAMES, DRUM_KEYS, DRUM_COLORS } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { useGameLoop } from '../../hooks/useGameLoop';

const engine = new DrumSimulatorEngine();

interface HitEffect {
  drumIndex: number;
  result: string;
  id: number;
}

export default function DrumSimulator() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [stats, setStats] = useState({ perfect: 0, great: 0, good: 0, miss: 0 });
  const [upcomingHits, setUpcomingHits] = useState<DrumHit[]>([]);
  const [hitEffects, setHitEffects] = useState<HitEffect[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [pressedDrums, setPressedDrums] = useState<Set<number>>(new Set());
  const canvasSize = engine.getCanvasSize();
  const drumPositions = engine.getDrumPositions();

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
    setUpcomingHits([...state.upcomingHits]);
    setTotalHits(state.totalHits);
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
    setUpcomingHits([]);
    setHitEffects([]);
    setTotalHits(0);
    setMultiplier(1);
  }, []);

  const handleHit = useCallback((drumIndex: number) => {
    if (gameState !== 'playing') return;

    const result = engine.handleHit(drumIndex);

    if (result.result !== 'empty') {
      setHitEffects(prev => [...prev, {
        drumIndex,
        result: result.result,
        id: Date.now(),
      }]);

      setTimeout(() => {
        setHitEffects(prev => prev.filter(e => e.id !== Date.now()));
      }, 300);
    }
  }, [gameState]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState !== 'playing') return;
    const keyIndex = DRUM_KEYS.indexOf(e.key.toUpperCase());
    if (keyIndex !== -1 && !pressedDrums.has(keyIndex)) {
      setPressedDrums(prev => new Set([...prev, keyIndex]));
      handleHit(keyIndex);
    }
  }, [gameState, handleHit, pressedDrums]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const keyIndex = DRUM_KEYS.indexOf(e.key.toUpperCase());
    if (keyIndex !== -1) {
      setPressedDrums(prev => {
        const newSet = new Set(prev);
        newSet.delete(keyIndex);
        return newSet;
      });
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [handleKeyDown, handleKeyUp]);

  const getResultColor = (result: string) => {
    const colors: Record<string, string> = {
      perfect: NEON_COLORS.perfect,
      great: NEON_COLORS.great,
      good: NEON_COLORS.good,
      miss: NEON_COLORS.miss,
    };
    return colors[result] || NEON_COLORS.text;
  };

  const renderMenu = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
        className="text-8xl mb-6"
      >
        🥁
      </motion.div>
      <h1 className="text-5xl font-bold mb-2" style={{
        color: NEON_COLORS.secondary,
        textShadow: `0 0 30px ${NEON_COLORS.secondary}, 0 0 60px ${NEON_COLORS.secondary}`
      }}>
        DrumSimulator
      </h1>
      <h2 className="text-2xl mb-12" style={{ color: NEON_COLORS.primary }}>
        架子鼓模拟
      </h2>
      <motion.button
        onClick={startGame}
        className="px-12 py-4 rounded-xl text-xl font-bold mb-4"
        style={{
          background: `linear-gradient(135deg, ${NEON_COLORS.secondary}, ${NEON_COLORS.primary})`,
          boxShadow: `0 0 30px ${NEON_COLORS.secondary}80`,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        开始演奏
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
        <p className="text-sm">按键: S D K L</p>
        <p className="text-sm">对应 底鼓 军鼓 踩镲 强音镲</p>
      </div>
    </motion.div>
  );

  const renderGame = () => (
    <div className="relative" style={{ width: canvasSize.width }}>
      <div
        className="rounded-xl overflow-hidden relative"
        style={{
          height: canvasSize.height,
          background: `linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)`,
          boxShadow: `0 0 40px ${NEON_COLORS.secondary}40`,
        }}
      >
        <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
          {drumPositions.map((pos, i) => {
            const hasUpcomingHit = upcomingHits.some(h => h.drumIndex === i && !h.hit);
            const hitEffect = hitEffects.find(e => e.drumIndex === i);
            const isPressed = pressedDrums.has(i);

            return (
              <motion.div
                key={i}
                className="absolute flex flex-col items-center"
                style={{ left: pos.x - 70, top: pos.y - 70 }}
              >
                <motion.button
                  className="rounded-full flex flex-col items-center justify-center font-bold"
                  style={{
                    width: pos.radius * 2,
                    height: pos.radius * 2,
                    background: `radial-gradient(circle at 30% 30%, ${DRUM_COLORS[i]}dd, ${DRUM_COLORS[i]}88)`,
                    border: `4px solid ${DRUM_COLORS[i]}`,
                    boxShadow: isPressed
                      ? `0 0 40px ${DRUM_COLORS[i]}, inset 0 0 20px rgba(255,255,255,0.5)`
                      : `0 0 20px ${DRUM_COLORS[i]}60, inset 0 -10px 20px rgba(0,0,0,0.3)`,
                    transform: isPressed ? 'scale(0.9)' : 'scale(1)',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onMouseDown={() => handleHit(i)}
                  onTouchStart={() => handleHit(i)}
                >
                  <span className="text-white text-3xl font-bold drop-shadow-lg">
                    {DRUM_KEYS[i]}
                  </span>
                  <span className="text-white text-xs opacity-80 mt-1">
                    {DRUM_NAMES[i]}
                  </span>
                </motion.button>

                <AnimatePresence>
                  {hasUpcomingHit && (
                    <motion.div
                      className="absolute rounded-full"
                      style={{
                        width: pos.radius * 2.5,
                        height: pos.radius * 2.5,
                        border: `3px solid ${DRUM_COLORS[i]}`,
                        top: -pos.radius * 0.25,
                        left: -pos.radius * 0.25,
                      }}
                      animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.3, 0.8] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {hitEffect && (
                    <motion.div
                      className="absolute -top-8 text-2xl font-bold"
                      style={{
                        color: getResultColor(hitEffect.result),
                        textShadow: `0 0 20px ${getResultColor(hitEffect.result)}`,
                      }}
                      initial={{ scale: 0, opacity: 1, y: 0 }}
                      animate={{ scale: 1.5, opacity: 0, y: -30 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {hitEffect.result === 'perfect' ? 'PERFECT!' :
                       hitEffect.result === 'great' ? 'GREAT!' :
                       hitEffect.result === 'good' ? 'GOOD!' : 'MISS!'}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <div className="glass-card rounded-lg px-4 py-2">
            <div className="text-xs opacity-70">分数</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.gold }}>{score}</div>
          </div>
          <div className="glass-card rounded-lg px-4 py-2 text-center">
            <div className="text-xs opacity-70">连击</div>
            <div className="text-2xl font-bold" style={{ color: combo > 10 ? NEON_COLORS.secondary : NEON_COLORS.text }}>
              {combo} x{multiplier.toFixed(1)}
            </div>
          </div>
          <div className="glass-card rounded-lg px-4 py-2 text-center">
            <div className="text-xs opacity-70">准确率</div>
            <div className="text-2xl font-bold" style={{
              color: accuracy > 80 ? NEON_COLORS.success : accuracy > 50 ? NEON_COLORS.gold : NEON_COLORS.danger
            }}>
              {accuracy}%
            </div>
          </div>
          <div className="glass-card rounded-lg px-4 py-2 text-center">
            <div className="text-xs opacity-70">完成</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.primary }}>{totalHits}/50</div>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex justify-between text-sm opacity-60">
            {stats.perfect > 0 && <span style={{ color: NEON_COLORS.perfect }}>完美: {stats.perfect}</span>}
            {stats.great > 0 && <span style={{ color: NEON_COLORS.great }}>很好: {stats.great}</span>}
            {stats.good > 0 && <span style={{ color: NEON_COLORS.good }}>好: {stats.good}</span>}
            {stats.miss > 0 && <span style={{ color: NEON_COLORS.miss }}>失误: {stats.miss}</span>}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {DRUM_NAMES.map((name, i) => (
          <div
            key={i}
            className="glass-card rounded-lg px-4 py-2 flex items-center gap-2"
          >
            <div
              className="w-4 h-4 rounded-full"
              style={{ background: DRUM_COLORS[i] }}
            />
            <span className="text-sm">{DRUM_KEYS[i]}: {name}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGameOver = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <div className="text-6xl mb-4">🥁</div>
      <h1 className="text-4xl font-bold mb-6" style={{ color: NEON_COLORS.success }}>
        演奏完成
      </h1>
      <div className="glass-card rounded-xl p-6 mb-6" style={{ minWidth: 300 }}>
        <div className="text-3xl font-bold mb-4 text-center" style={{ color: NEON_COLORS.gold }}>
          最终得分: {score}
        </div>
        <div className="flex justify-between mb-2">
          <span>最大连击:</span>
          <span style={{ color: NEON_COLORS.secondary }}>{maxCombo}</span>
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
          background: `linear-gradient(135deg, ${NEON_COLORS.secondary}, ${NEON_COLORS.primary})`,
          boxShadow: `0 0 30px ${NEON_COLORS.secondary}50`,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        再来一次
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
          border: 1px solid ${NEON_COLORS.secondary}30;
        }
      `}</style>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'gameover' && renderGameOver()}
    </div>
  );
}
