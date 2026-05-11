
import { useState, useCallback, useEffect, useRef } from 'react';
import { SpeedMathEngine, GameState, SpeedMathProblem } from './engine';
import { motion, AnimatePresence } from 'framer-motion';
import { NEON_COLORS } from '../../utils/constants';

type GamePhase = 'menu' | 'playing' | 'result';
type Difficulty = 'easy' | 'medium' | 'hard';
type GameMode = 'timed' | 'endless';

const DIFFICULTIES: { value: Difficulty; label: string; description: string }[] = [
  { value: 'easy', label: '简单', description: '加法和减法，数字范围 1-10' },
  { value: 'medium', label: '中等', description: '加法、减法和乘法，数字范围 5-25' },
  { value: 'hard', label: '困难', description: '四则运算，数字范围 10-50' },
];

const MODES: { value: GameMode; label: string; description: string }[] = [
  { value: 'timed', label: '限时模式', description: '60秒内尽可能多答题' },
  { value: 'endless', label: '无尽模式', description: '每答对一题增加时间' },
];

export default function SpeedMath() {
  const engineRef = useRef&lt;SpeedMathEngine&gt;(new SpeedMathEngine());
  const [phase, setPhase] = useState&lt;GamePhase&gt;('menu');
  const [selectedDifficulty, setSelectedDifficulty] = useState&lt;Difficulty&gt;('easy');
  const [selectedMode, setSelectedMode] = useState&lt;GameMode&gt;('timed');
  const [gameState, setGameState] = useState&lt;GameState&gt;(engineRef.current.getState());
  const [feedback, setFeedback] = useState<any>(null);

  useEffect(() =&gt; {
    engineRef.current.setTimeUpdateCallback((time) =&gt; {
      setGameState(engineRef.current.getState());
      if (time &lt;= 0) {
        setPhase('result');
      }
    });
  }, []);

  const startGame = useCallback(() =&gt; {
    engineRef.current.startGame(selectedDifficulty, selectedMode);
    setGameState(engineRef.current.getState());
    setFeedback(null);
    setPhase('playing');
  }, [selectedDifficulty, selectedMode]);

  const handleAnswer = useCallback((answer: number) =&gt; {
    const result = engineRef.current.submitAnswer(answer);
    setFeedback(result);
    setGameState(engineRef.current.getState());

    if (!engineRef.current.getState().isPlaying) {
      setTimeout(() =&gt; {
        setPhase('result');
      }, 500);
    }

    setTimeout(() =&gt; {
      setFeedback(null);
    }, 300);
  }, []);

  const handleExit = useCallback(() =&gt; {
    engineRef.current.stopGame();
    setPhase('menu');
  }, []);

  const renderProblem = (problem: SpeedMathProblem) =&gt; {
    return (
      &lt;div className="flex flex-col items-center gap-8"&gt;
        &lt;motion.div
          key={problem.id}
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="text-6xl font-bold text-white"
        &gt;
          {problem.num1} {problem.operation} {problem.num2} = ?
        &lt;/motion.div&gt;

        &lt;div className="grid grid-cols-2 gap-4 w-full max-w-md"&gt;
          {problem.options.map((option, index) =&gt; (
            &lt;motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =&gt; handleAnswer(option)}
              className="px-8 py-6 text-3xl font-bold rounded-xl text-white transition-all"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
                boxShadow: `0 0 20px ${NEON_COLORS.primary}50`
              }}
            &gt;
              {option}
            &lt;/motion.button&gt;
          ))}
        &lt;/div&gt;
      &lt;/div&gt;
    );
  };

  if (phase === 'menu') {
    return (
      &lt;div 
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}
      &gt;
        &lt;motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        &gt;
          &lt;h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-green-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent"&gt;
            ⚡ 速算大师
          &lt;/h1&gt;
          &lt;p className="text-gray-400 mb-8"&gt;SpeedMath&lt;/p&gt;

          &lt;div className="glass-card rounded-2xl p-6 max-w-lg mx-auto mb-6"&gt;
            &lt;h3 className="text-lg font-bold text-cyan-400 mb-3"&gt;游戏规则&lt;/h3&gt;
            &lt;ul className="text-gray-300 text-left space-y-2"&gt;
              &lt;li&gt;• 快速选择正确的答案&lt;/li&gt;
              &lt;li&gt;• 连续答对可获得额外分数&lt;/li&gt;
              &lt;li&gt;• 无尽模式每答对一题可增加时间&lt;/li&gt;
            &lt;/ul&gt;
          &lt;/div&gt;

          &lt;h3 className="text-lg font-bold text-gray-300 mb-3"&gt;选择难度&lt;/h3&gt;
          &lt;div className="flex flex-wrap gap-3 justify-center mb-6"&gt;
            {DIFFICULTIES.map((diff) =&gt; (
              &lt;motion.button
                key={diff.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =&gt; setSelectedDifficulty(diff.value)}
                className={`px-6 py-4 rounded-xl font-bold transition-all ${
                  selectedDifficulty === diff.value ? 'text-white' : 'text-gray-400 bg-gray-800'
                }`}
                style={{
                  background: selectedDifficulty === diff.value 
                    ? `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`
                    : undefined,
                  boxShadow: selectedDifficulty === diff.value 
                    ? `0 0 20px ${NEON_COLORS.primary}50`
                    : undefined,
                }}
              &gt;
                &lt;div&gt;{diff.label}&lt;/div&gt;
                &lt;div className="text-xs opacity-75"&gt;{diff.description}&lt;/div&gt;
              &lt;/motion.button&gt;
            ))}
          &lt;/div&gt;

          &lt;h3 className="text-lg font-bold text-gray-300 mb-3"&gt;选择模式&lt;/h3&gt;
          &lt;div className="flex flex-wrap gap-3 justify-center mb-8"&gt;
            {MODES.map((mode) =&gt; (
              &lt;motion.button
                key={mode.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =&gt; setSelectedMode(mode.value)}
                className={`px-6 py-4 rounded-xl font-bold transition-all ${
                  selectedMode === mode.value ? 'text-white' : 'text-gray-400 bg-gray-800'
                }`}
                style={{
                  background: selectedMode === mode.value 
                    ? `linear-gradient(135deg, ${NEON_COLORS.success}, #00aa00)`
                    : undefined,
                  boxShadow: selectedMode === mode.value 
                    ? `0 0 20px ${NEON_COLORS.success}50`
                    : undefined,
                }}
              &gt;
                &lt;div&gt;{mode.label}&lt;/div&gt;
                &lt;div className="text-xs opacity-75"&gt;{mode.description}&lt;/div&gt;
              &lt;/motion.button&gt;
            ))}
          &lt;/div&gt;

          &lt;motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="px-12 py-4 text-xl font-bold rounded-2xl text-white"
            style={{ 
              background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, #ff6b9d)`,
              boxShadow: `0 0 30px ${NEON_COLORS.neonPink}50`
            }}
          &gt;
            开始挑战
          &lt;/motion.button&gt;
        &lt;/motion.div&gt;

        &lt;style&gt;{`
          .glass-card {
            background: rgba(26, 26, 46, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(108, 92, 231, 0.3);
          }
        `}&lt;/style&gt;
      &lt;/div&gt;
    );
  }

  if (phase === 'result') {
    return (
      &lt;div 
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}
      &gt;
        &lt;motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        &gt;
          &lt;h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent"&gt;
            挑战结束！
          &lt;/h1&gt;
          
          &lt;div className="glass-card rounded-2xl p-8 max-w-md mx-auto mb-8"&gt;
            &lt;div className="text-6xl font-bold mb-4 text-yellow-400"&gt;
              {gameState.score}
            &lt;/div&gt;
            &lt;p className="text-gray-400 mb-6"&gt;总分&lt;/p&gt;
            
            &lt;div className="grid grid-cols-2 gap-4"&gt;
              &lt;div className="bg-gray-800 rounded-xl p-4"&gt;
                &lt;div className="text-sm text-gray-400"&gt;答题数&lt;/div&gt;
                &lt;div className="text-2xl font-bold text-cyan-400"&gt;{gameState.problemsSolved}&lt;/div&gt;
              &lt;/div&gt;
              &lt;div className="bg-gray-800 rounded-xl p-4"&gt;
                &lt;div className="text-sm text-gray-400"&gt;最高连胜&lt;/div&gt;
                &lt;div className="text-2xl font-bold text-pink-400"&gt;{gameState.maxStreak}&lt;/div&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;
          
          &lt;div className="flex gap-4 justify-center"&gt;
            &lt;motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="px-8 py-3 text-lg font-bold rounded-xl text-white"
              style={{ 
                background: `linear-gradient(135deg, ${NEON_COLORS.success}, #00aa00)`,
                boxShadow: `0 0 20px ${NEON_COLORS.success}50`
              }}
            &gt;
              再来一次
            &lt;/motion.button&gt;
            &lt;motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExit}
              className="px-8 py-3 text-lg font-bold rounded-xl text-white"
              style={{ 
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}, #2a2a4e)`,
                border: `2px solid ${NEON_COLORS.primary}`
              }}
            &gt;
              返回菜单
            &lt;/motion.button&gt;
          &lt;/div&gt;
        &lt;/motion.div&gt;

        &lt;style&gt;{`
          .glass-card {
            background: rgba(26, 26, 46, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(108, 92, 231, 0.3);
          }
        `}&lt;/style&gt;
      &lt;/div&gt;
    );
  }

  return (
    &lt;div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}
    &gt;
      &lt;motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-4xl mb-8"
      &gt;
        &lt;div className="flex items-center justify-between gap-4"&gt;
          &lt;motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExit}
            className="px-4 py-2 rounded-lg font-bold text-sm"
            style={{
              backgroundColor: NEON_COLORS.darkPurple,
              color: NEON_COLORS.neonBlue,
              border: `1px solid ${NEON_COLORS.neonBlue}`
            }}
          &gt;
            退出
          &lt;/motion.button&gt;

          &lt;div className="flex gap-4"&gt;
            &lt;div className="glass-card px-6 py-3 rounded-xl text-center"&gt;
              &lt;div className="text-sm text-gray-400"&gt;分数&lt;/div&gt;
              &lt;div className="text-2xl font-bold text-yellow-400"&gt;{gameState.score}&lt;/div&gt;
            &lt;/div&gt;
            &lt;div className="glass-card px-6 py-3 rounded-xl text-center"&gt;
              &lt;div className="text-sm text-gray-400"&gt;时间&lt;/div&gt;
              &lt;div className="text-2xl font-bold" style={{ color: gameState.timeLeft &lt;= 10 ? '#e74c3c' : NEON_COLORS.neonBlue }}&gt;
                {gameState.timeLeft}s
              &lt;/div&gt;
            &lt;/div&gt;
            &lt;div className="glass-card px-6 py-3 rounded-xl text-center"&gt;
              &lt;div className="text-sm text-gray-400"&gt;连胜&lt;/div&gt;
              &lt;div className="text-2xl font-bold text-pink-400"&gt;{gameState.streak}&lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/motion.div&gt;

      &lt;motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card rounded-2xl p-12"
        style={{ minWidth: '600px' }}
      &gt;
        {gameState.currentProblem &amp;&amp; renderProblem(gameState.currentProblem)}
      &lt;/motion.div&gt;

      &lt;AnimatePresence&gt;
        {feedback &amp;&amp; (
          &lt;motion.div
            initial={{ scale: 0, opacity: 0, y: -50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: -50 }}
            className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-12 py-6 rounded-2xl font-bold text-4xl z-50 ${
              feedback.isCorrect ? 'text-green-400' : 'text-red-400'
            }`}
            style={{
              backgroundColor: feedback.isCorrect ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)',
              border: `2px solid ${feedback.isCorrect ? NEON_COLORS.success : '#e74c3c'}`
            }}
          &gt;
            {feedback.isCorrect ? `+${feedback.points}` : '✗'}
          &lt;/motion.div&gt;
        )}
      &lt;/AnimatePresence&gt;

      &lt;style&gt;{`
        .glass-card {
          background: rgba(26, 26, 46, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(108, 92, 231, 0.3);
        }
      `}&lt;/style&gt;
    &lt;/div&gt;
  );
}
