import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GuessSongEngine, GUESS_SONG_CONSTANTS } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { useGameLoop } from '../../hooks/useGameLoop';

const engine = new GuessSongEngine();

export default function GuessSong() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(engine.getState());
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  const handleGameLoop = useCallback((deltaTime: number) => {
    engine.tick(deltaTime);
    setGameState({ ...engine.getState() });
  }, []);

  useGameLoop(handleGameLoop, gameState.gamePhase === 'playing');

  const startGame = useCallback((difficulty: 'easy' | 'medium' | 'hard') => {
    engine.start(difficulty);
    setGameState({ ...engine.getState() });
  }, []);

  const handleAnswer = useCallback((answer: string) => {
    engine.selectAnswer(answer);
    setGameState({ ...engine.getState() });
  }, []);

  const handleNext = useCallback(() => {
    engine.nextQuestion();
    setGameState({ ...engine.getState() });
  }, []);

  const handleReplay = useCallback(() => {
    engine.replayMelody();
  }, []);

  const handleHint = useCallback(() => {
    engine.useHint();
    setGameState({ ...engine.getState() });
  }, []);

  const getDifficultyColor = (diff: 'easy' | 'medium' | 'hard') => {
    const colors = {
      easy: NEON_COLORS.success,
      medium: NEON_COLORS.gold,
      hard: NEON_COLORS.danger,
    };
    return colors[diff];
  };

  const getDifficultyName = (diff: 'easy' | 'medium' | 'hard') => {
    const names = { easy: '简单', medium: '中等', hard: '困难' };
    return names[diff];
  };

  const renderMenu = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-8xl mb-6"
      >
        🎵
      </motion.div>
      <h1 className="text-5xl font-bold mb-2" style={{
        color: NEON_COLORS.primary,
        textShadow: `0 0 30px ${NEON_COLORS.primary}, 0 0 60px ${NEON_COLORS.primary}`
      }}>
        听歌识曲
      </h1>
      <p className="text-xl mb-8" style={{ color: NEON_COLORS.textDim }}>
        听旋律猜歌名
      </p>

      <div className="mb-8">
        <p className="text-center mb-4 text-lg">选择难度</p>
        <div className="flex gap-4">
          {(['easy', 'medium', 'hard'] as const).map(diff => (
            <motion.button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className="px-6 py-3 rounded-xl font-bold"
              style={{
                background: selectedDifficulty === diff
                  ? getDifficultyColor(diff)
                  : NEON_COLORS.surface,
                border: `2px solid ${getDifficultyColor(diff)}`,
                color: selectedDifficulty === diff ? NEON_COLORS.background : getDifficultyColor(diff),
                boxShadow: selectedDifficulty === diff ? `0 0 20px ${getDifficultyColor(diff)}80` : 'none',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {getDifficultyName(diff)}
            </motion.button>
          ))}
        </div>
      </div>

      <motion.button
        onClick={() => startGame(selectedDifficulty)}
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
        className="px-6 py-2 rounded-lg"
        style={{
          background: 'transparent',
          border: `2px solid ${NEON_COLORS.textDim}`,
          color: NEON_COLORS.textDim,
        }}
      >
        返回主页
      </button>

      <div className="mt-8 text-center opacity-60">
        <p className="mb-2">游戏规则</p>
        <p className="text-sm">听旋律在选项中选择正确的歌曲</p>
        <p className="text-sm">连续答对获得额外加分</p>
        <p className="text-sm">使用提示会扣分哦</p>
      </div>
    </motion.div>
  );

  const renderGame = () => {
    const songInfo = engine.getSongInfo();
    const correctAnswer = songInfo ? `${songInfo.title} - ${songInfo.artist}` : '';

    return (
      <div className="flex flex-col items-center" style={{ width: GUESS_SONG_CONSTANTS.CANVAS_WIDTH }}>
        <div className="w-full flex justify-between items-center mb-6">
          <div className="glass-card rounded-lg px-4 py-2">
            <div className="text-xs opacity-70">分数</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.gold }}>{gameState.score}</div>
          </div>
          <div className="glass-card rounded-lg px-4 py-2 text-center">
            <div className="text-xs opacity-70">回合</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.primary }}>
              {gameState.totalRounds}/{GUESS_SONG_CONSTANTS.ROUNDS_PER_GAME}
            </div>
          </div>
          <div className="glass-card rounded-lg px-4 py-2 text-center">
            <div className="text-xs opacity-70">连击</div>
            <div className="text-2xl font-bold" style={{ color: gameState.streak > 3 ? NEON_COLORS.secondary : NEON_COLORS.text }}>
              {gameState.streak}
            </div>
          </div>
          <div className="glass-card rounded-lg px-4 py-2 text-center">
            <div className="text-xs opacity-70">时间</div>
            <div
              className="text-2xl font-bold"
              style={{ color: gameState.timeLeft <= 5 ? NEON_COLORS.danger : NEON_COLORS.text }}
            >
              {Math.ceil(gameState.timeLeft)}s
            </div>
          </div>
        </div>

        <div
          className="w-full rounded-2xl p-8 mb-6 flex flex-col items-center"
          style={{
            background: `linear-gradient(135deg, ${NEON_COLORS.surface} 0%, #16213e 100%)`,
            boxShadow: `0 0 40px ${NEON_COLORS.primary}40`,
          }}
        >
          <motion.div
            animate={gameState.isPlaying ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: gameState.isPlaying ? Infinity : 0 }}
            className="text-6xl mb-4"
          >
            🎵
          </motion.div>

          {gameState.selectedAnswer === null ? (
            <>
              <p className="text-xl mb-4" style={{ color: NEON_COLORS.textDim }}>
                听旋律，选择正确的歌曲
              </p>
              <div className="flex gap-4">
                <motion.button
                  onClick={handleReplay}
                  className="px-6 py-3 rounded-xl font-bold flex items-center gap-2"
                  style={{
                    background: NEON_COLORS.surface,
                    border: `2px solid ${NEON_COLORS.primary}`,
                    color: NEON_COLORS.primary,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>🔊</span> 再听一次
                </motion.button>
                <motion.button
                  onClick={handleHint}
                  disabled={gameState.hintUsed}
                  className="px-6 py-3 rounded-xl font-bold flex items-center gap-2"
                  style={{
                    background: gameState.hintUsed ? NEON_COLORS.surface : 'transparent',
                    border: `2px solid ${gameState.hintUsed ? NEON_COLORS.textDim : NEON_COLORS.gold}`,
                    color: gameState.hintUsed ? NEON_COLORS.textDim : NEON_COLORS.gold,
                    opacity: gameState.hintUsed ? 0.5 : 1,
                  }}
                  whileHover={!gameState.hintUsed ? { scale: 1.05 } : {}}
                  whileTap={!gameState.hintUsed ? { scale: 0.95 } : {}}
                >
                  <span>💡</span> 提示 {gameState.hintUsed ? '(已用)' : '(-50分)'}
                </motion.button>
              </div>

              {gameState.hintUsed && songInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 px-4 py-2 rounded-lg"
                  style={{ background: `${NEON_COLORS.gold}20` }}
                >
                  <span style={{ color: NEON_COLORS.gold }}>提示：</span>
                  <span style={{ color: NEON_COLORS.text }}>这是{songInfo.genre}类型的歌曲</span>
                </motion.div>
              )}
            </>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center"
              >
                <motion.div
                  className="text-5xl mb-4"
                  animate={gameState.isCorrect ? { scale: [1, 1.2, 1] } : {}}
                >
                  {gameState.isCorrect ? '✅' : '❌'}
                </motion.div>
                <p
                  className="text-2xl font-bold mb-2"
                  style={{ color: gameState.isCorrect ? NEON_COLORS.success : NEON_COLORS.danger }}
                >
                  {gameState.isCorrect ? '回答正确!' : '回答错误'}
                </p>
                {gameState.isCorrect && (
                  <p className="text-lg mb-2" style={{ color: NEON_COLORS.gold }}>
                    +{gameState.pointsEarned} 分
                  </p>
                )}
                <p className="text-xl mb-4" style={{ color: NEON_COLORS.primary }}>
                  正确答案: {correctAnswer}
                </p>
                <motion.button
                  onClick={handleNext}
                  className="px-8 py-3 rounded-xl font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
                    boxShadow: `0 0 20px ${NEON_COLORS.primary}80`,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {gameState.totalRounds >= GUESS_SONG_CONSTANTS.ROUNDS_PER_GAME ? '查看结果' : '下一题'}
                </motion.button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {gameState.selectedAnswer === null && (
          <div className="w-full grid grid-cols-2 gap-4">
            {gameState.options.map((option, index) => (
              <motion.button
                key={index}
                onClick={() => handleAnswer(option)}
                className="p-4 rounded-xl text-left"
                style={{
                  background: NEON_COLORS.surface,
                  border: `2px solid ${NEON_COLORS.secondary}40`,
                }}
                whileHover={{ scale: 1.02, borderColor: NEON_COLORS.primary }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-lg">{option}</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderGameOver = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center"
    >
      <div className="text-6xl mb-4">🏆</div>
      <h1 className="text-4xl font-bold mb-6" style={{ color: NEON_COLORS.gold }}>
        游戏结束
      </h1>

      <div className="glass-card rounded-xl p-6 mb-6" style={{ minWidth: 300 }}>
        <div className="text-4xl font-bold mb-4 text-center" style={{ color: NEON_COLORS.gold }}>
          {gameState.score} 分
        </div>

        <div className="flex justify-between mb-2">
          <span>正确率:</span>
          <span style={{ color: NEON_COLORS.primary }}>{engine.getAccuracy()}%</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>答对题数:</span>
          <span style={{ color: NEON_COLORS.success }}>{gameState.correctAnswers}/{gameState.totalRounds}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>最大连击:</span>
          <span style={{ color: NEON_COLORS.secondary }}>{gameState.maxStreak}</span>
        </div>
        <div className="flex justify-between">
          <span>难度:</span>
          <span style={{ color: getDifficultyColor(gameState.difficulty) }}>
            {getDifficultyName(gameState.difficulty)}
          </span>
        </div>
      </div>

      <motion.button
        onClick={() => startGame(gameState.difficulty)}
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
          border: 1px solid ${NEON_COLORS.secondary}30;
        }
      `}</style>
      {gameState.gamePhase === 'menu' && renderMenu()}
      {gameState.gamePhase === 'playing' && renderGame()}
      {gameState.gamePhase === 'gameover' && renderGameOver()}
    </div>
  );
}
