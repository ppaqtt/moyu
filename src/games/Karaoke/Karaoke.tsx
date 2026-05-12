import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { KaraokeEngine, LyricLine, PITCH_LABELS, PITCH_COLORS } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { useGameLoop } from '../../hooks/useGameLoop';

const engine = new KaraokeEngine();

export default function Karaoke() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentPitch, setCurrentPitch] = useState(0);
  const [pitchAccuracy, setPitchAccuracy] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedPitch, setSelectedPitch] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [completedLines, setCompletedLines] = useState(0);
  const [totalLines, setTotalLines] = useState(0);
  const feedbackTimerRef = useRef<number | null>(null);

  const handleGameLoop = useCallback((deltaTime: number) => {
    engine.tick(deltaTime);
    const state = engine.getState();
    setScore(state.score);
    setCurrentLineIndex(state.currentLineIndex);
    setLyrics([...state.lyrics]);
    setCurrentPitch(state.currentPitch);
    setPitchAccuracy(state.pitchAccuracy);
    setStreak(state.streak);
    setCompletedLines(state.currentLineIndex);
    setTotalLines(state.lyrics.length);

    if (state.isGameOver && gameState === 'playing') {
      setGameState('gameover');
    }
  }, [gameState]);

  useGameLoop(handleGameLoop, gameState === 'playing');

  const startGame = useCallback(() => {
    engine.start();
    setGameState('playing');
    setScore(0);
    setCurrentLineIndex(0);
    setCurrentPitch(0);
    setPitchAccuracy(0);
    setFeedback(null);
    setSelectedPitch(null);
    setStreak(0);
    setCompletedLines(0);
  }, []);

  const handlePitchSelect = useCallback((pitch: number) => {
    if (gameState !== 'playing') return;

    setSelectedPitch(pitch);
    const result = engine.sing(pitch);
    setPitchAccuracy(result.accuracy);

    if (result.isCorrect) {
      setFeedback('太棒了!');
    } else if (result.accuracy >= 60) {
      setFeedback('不错!');
    } else {
      setFeedback('再来一次');
    }

    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
      setSelectedPitch(null);
    }, 800);
  }, [gameState]);

  const handlePrevLine = useCallback(() => {
    engine.selectPrevLine();
  }, []);

  const handleNextLine = useCallback(() => {
    engine.selectNextLine();
  }, []);

  const getFeedbackColor = (acc: number) => {
    if (acc >= 80) return NEON_COLORS.success;
    if (acc >= 60) return NEON_COLORS.gold;
    return NEON_COLORS.danger;
  };

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
        🎤
      </motion.div>
      <h1 className="text-5xl font-bold mb-2" style={{
        color: NEON_COLORS.neonPink,
        textShadow: `0 0 30px ${NEON_COLORS.neonPink}, 0 0 60px ${NEON_COLORS.neonPink}`
      }}>
        Karaoke
      </h1>
      <h2 className="text-2xl mb-12" style={{ color: NEON_COLORS.neonPurple }}>
        卡拉OK练习
      </h2>
      <motion.button
        onClick={startGame}
        className="px-12 py-4 rounded-xl text-xl font-bold mb-4"
        style={{
          background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonPurple})`,
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}80`,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        开始演唱
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
        <p className="text-sm">选择音高按钮来唱歌</p>
        <p className="text-sm">尽量选择正确的音高获得高分</p>
      </div>
    </motion.div>
  );

  const renderGame = () => (
    <div className="flex flex-col items-center gap-4" style={{ width: 600 }}>
      <div className="w-full glass-card rounded-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-xs opacity-70">分数</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.gold }}>{score}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70">进度</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.primary }}>
              {completedLines}/{totalLines}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-70">连唱</div>
            <div className="text-2xl font-bold" style={{ color: streak > 5 ? NEON_COLORS.success : NEON_COLORS.text }}>
              {streak}
            </div>
          </div>
        </div>

        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: NEON_COLORS.surface }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonPurple})` }}
            animate={{ width: `${(completedLines / totalLines) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="w-full glass-card rounded-xl p-6" style={{ minHeight: 200 }}>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevLine}
            disabled={currentLineIndex === 0}
            className="px-3 py-1 rounded-lg"
            style={{
              background: currentLineIndex === 0 ? 'transparent' : NEON_COLORS.surface,
              border: `1px solid ${NEON_COLORS.primary}40`,
              color: NEON_COLORS.text,
              opacity: currentLineIndex === 0 ? 0.3 : 1,
            }}
          >
            ←
          </button>

          <div className="text-center flex-1">
            <div className="text-sm opacity-60 mb-2">第 {currentLineIndex + 1} 句</div>
            {lyrics[currentLineIndex] && (
              <motion.div
                key={currentLineIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold mb-2"
                style={{ color: NEON_COLORS.text }}
              >
                {lyrics[currentLineIndex].text}
              </motion.div>
            )}
            {lyrics[currentLineIndex]?.pinyin && (
              <div className="text-lg opacity-60">
                {lyrics[currentLineIndex].pinyin}
              </div>
            )}
          </div>

          <button
            onClick={handleNextLine}
            disabled={currentLineIndex >= totalLines - 1}
            className="px-3 py-1 rounded-lg"
            style={{
              background: currentLineIndex >= totalLines - 1 ? 'transparent' : NEON_COLORS.surface,
              border: `1px solid ${NEON_COLORS.primary}40`,
              color: NEON_COLORS.text,
              opacity: currentLineIndex >= totalLines - 1 ? 0.3 : 1,
            }}
          >
            →
          </button>
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div
              className="text-center text-2xl font-bold mb-4"
              style={{
                color: getFeedbackColor(pitchAccuracy),
                textShadow: `0 0 20px ${getFeedbackColor(pitchAccuracy)}`,
              }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              {feedback}
            </motion.div>
          )}
        </AnimatePresence>

        {lyrics[currentLineIndex]?.pitch && (
          <div className="text-center text-sm opacity-60 mb-4">
            目标音高: <span className="font-bold" style={{ color: PITCH_COLORS[lyrics[currentLineIndex].pitch! - 1] }}>
              {PITCH_LABELS[lyrics[currentLineIndex].pitch! - 1]}
            </span>
          </div>
        )}
      </div>

      <div className="w-full glass-card rounded-xl p-6">
        <div className="text-center text-sm opacity-60 mb-4">选择音高</div>
        <div className="flex justify-center gap-3">
          {PITCH_LABELS.map((label, i) => (
            <motion.button
              key={i}
              className="w-14 h-14 rounded-full font-bold text-xl flex items-center justify-center"
              style={{
                background: selectedPitch === i + 1
                  ? PITCH_COLORS[i]
                  : `${PITCH_COLORS[i]}40`,
                border: `3px solid ${PITCH_COLORS[i]}`,
                boxShadow: selectedPitch === i + 1
                  ? `0 0 20px ${PITCH_COLORS[i]}, 0 0 40px ${PITCH_COLORS[i]}`
                  : `0 0 10px ${PITCH_COLORS[i]}40`,
                color: selectedPitch === i + 1 ? '#fff' : PITCH_COLORS[i],
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePitchSelect(i + 1)}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="w-full">
        <div className="flex justify-center gap-2 flex-wrap">
          {lyrics.map((line, i) => (
            <div
              key={line.id}
              className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
              style={{
                background: i < currentLineIndex
                  ? NEON_COLORS.success + '80'
                  : i === currentLineIndex
                    ? NEON_COLORS.neonPink
                    : NEON_COLORS.surface,
                color: i <= currentLineIndex ? '#fff' : NEON_COLORS.textDim,
                border: `1px solid ${i === currentLineIndex ? NEON_COLORS.neonPink : 'transparent'}`,
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGameOver = () => {
    const avgAccuracy = completedLines > 0 ? Math.round(score / completedLines) : 0;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center"
      >
        <div className="text-6xl mb-4">🎤</div>
        <h1 className="text-4xl font-bold mb-6" style={{ color: NEON_COLORS.neonPink }}>
          演唱完成
        </h1>
        <div className="glass-card rounded-xl p-6 mb-6" style={{ minWidth: 300 }}>
          <div className="text-3xl font-bold mb-4 text-center" style={{ color: NEON_COLORS.gold }}>
            最终得分: {score}
          </div>
          <div className="flex justify-between mb-2">
            <span>演唱句数:</span>
            <span style={{ color: NEON_COLORS.primary }}>{completedLines}/{totalLines}</span>
          </div>
          <div className="flex justify-between mb-4">
            <span>平均音准:</span>
            <span style={{
              color: avgAccuracy >= 80 ? NEON_COLORS.success :
                     avgAccuracy >= 60 ? NEON_COLORS.gold : NEON_COLORS.danger
            }}>
              {avgAccuracy}%
            </span>
          </div>

          <div className="text-center mb-4">
            <div className="text-lg opacity-70 mb-2">评级</div>
            {score >= 800 && (
              <div className="text-3xl" style={{ color: NEON_COLORS.gold }}>⭐⭐⭐ SSS</div>
            )}
            {score >= 600 && score < 800 && (
              <div className="text-3xl" style={{ color: NEON_COLORS.success }}>⭐⭐ AA</div>
            )}
            {score >= 400 && score < 600 && (
              <div className="text-3xl" style={{ color: NEON_COLORS.primary }}>⭐ A</div>
            )}
            {score < 400 && (
              <div className="text-3xl" style={{ color: NEON_COLORS.textDim }}>继续努力</div>
            )}
          </div>
        </div>
        <motion.button
          onClick={startGame}
          className="px-10 py-3 rounded-xl text-lg font-bold mb-3"
          style={{
            background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonPurple})`,
            boxShadow: `0 0 30px ${NEON_COLORS.neonPink}50`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          再唱一首
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
  };

  return (
    <div className="flex flex-col items-center p-4 min-h-screen" style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #1a0a2e 100%)` }}>
      <style>{`
        .glass-card {
          background: ${NEON_COLORS.surface}dd;
          backdrop-filter: blur(10px);
          border: 1px solid ${NEON_COLORS.neonPink}30;
        }
      `}</style>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'gameover' && renderGameOver()}
    </div>
  );
}
