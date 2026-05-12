import { useState, useEffect, useCallback, useRef } from 'react';
import { RiddleGuessEngine, Riddle } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';

type GamePhase = 'menu' | 'playing' | 'result';
type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';

const DIFFICULTIES = [
  { key: 'easy', label: '简单', subtitle: '动物/物品类', color: '#22c55e' },
  { key: 'medium', label: '中等', subtitle: '自然现象类', color: '#3b82f6' },
  { key: 'hard', label: '困难', subtitle: '抽象谜语', color: '#f59e0b' },
  { key: 'mixed', label: '混合', subtitle: '全部类型', color: '#a855f7' }
];

export default function RiddleGuess() {
  const [difficulty, setDifficulty] = useState<Difficulty>('mixed');
  const [engine, setEngine] = useState(() => new RiddleGuessEngine('mixed', 10));
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [currentRiddle, setCurrentRiddle] = useState<Riddle | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [progress, setProgress] = useState({ current: 0, total: 10 });
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'pending'>('pending');
  const [message, setMessage] = useState('');
  const [hintMessage, setHintMessage] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadState = useCallback(() => {
    const state = engine.getState();
    setCurrentRiddle(state.currentRiddle);
    setUserAnswer(state.userAnswer);
    setScore(state.score);
    setStreak(state.streak);
    setProgress(engine.getProgress());
    setFeedback(state.feedback);
    setShowAnswer(engine.shouldShowAnswer());
  }, [engine]);

  const startGame = (diff: Difficulty) => {
    const newEngine = new RiddleGuessEngine(diff, 10);
    setEngine(newEngine);
    setDifficulty(diff);
    
    const state = newEngine.getState();
    setCurrentRiddle(state.currentRiddle);
    setUserAnswer('');
    setScore(0);
    setStreak(0);
    setProgress({ current: 1, total: 10 });
    setFeedback('pending');
    setMessage('');
    setHintMessage('');
    setShowAnswer(false);
    setPhase('playing');
  };

  // Focus input
  useEffect(() => {
    if (phase === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase, currentRiddle]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!userAnswer.trim() || feedback === 'correct') return;
    
    engine.setAnswer(userAnswer);
    const result = engine.submitAnswer();
    setMessage(result.message);
    loadState();

    if (result.correct || engine.getFeedback() === 'wrong') {
      setTimeout(() => {
        if (engine.isGameComplete()) {
          setPhase('result');
        } else {
          engine.nextRiddle();
          loadState();
          setUserAnswer('');
          setMessage('');
          setHintMessage('');
        }
      }, 2000);
    }
  };

  const handleHint = () => {
    const hint = engine.useHint();
    if (hint) {
      loadState();
      setHintMessage(hint);
      setTimeout(() => setHintMessage(''), 5000);
    }
  };

  const handleSkip = () => {
    engine.skipRiddle();
    loadState();
    setUserAnswer('');
    setMessage('');
    setHintMessage('');
  };

  const handleReveal = () => {
    const answer = engine.revealAnswer();
    loadState();
    setMessage(`答案是: ${answer}`);
    
    setTimeout(() => {
      if (engine.isGameComplete()) {
        setPhase('result');
      } else {
        engine.nextRiddle();
        loadState();
        setUserAnswer('');
        setMessage('');
        setHintMessage('');
      }
    }, 2000);
  };

  // Menu Screen
  if (phase === 'menu') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
           style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
            猜谜语
          </h1>
          <p className="text-gray-400 mb-8 text-xl">Riddle Guess Challenge</p>

          <div className="glass-card rounded-2xl p-8 max-w-md mx-auto mb-8">
            <h3 className="text-xl font-bold text-orange-400 mb-4">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>1. 阅读谜面，猜出谜底</li>
              <li>2. 每题有3次尝试机会</li>
              <li>3. 可以使用提示功能</li>
              <li>4. 连续答对可获得连击加分!</li>
              <li>5. 完成10道谜语查看成绩</li>
            </ul>
          </div>

          <h3 className="text-lg font-bold text-gray-300 mb-4">选择难度</h3>
          <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto">
            {DIFFICULTIES.map((d) => (
              <motion.button
                key={d.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDifficulty(d.key as Difficulty)}
                className={`px-5 py-4 rounded-xl font-bold transition-all ${
                  difficulty === d.key 
                    ? 'text-white ring-2 ring-white' 
                    : 'text-gray-400 bg-gray-800 hover:bg-gray-700'
                }`}
                style={{
                  background: difficulty === d.key 
                    ? `linear-gradient(135deg, ${d.color}, ${d.color}88)`
                    : undefined,
                  boxShadow: difficulty === d.key 
                    ? `0 0 20px ${d.color}50` 
                    : undefined
                }}
              >
                <div className="text-lg">{d.label}</div>
                <div className="text-xs opacity-75">{d.subtitle}</div>
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => startGame(difficulty)}
            className="px-12 py-4 text-xl font-bold rounded-2xl text-white"
            style={{ 
              background: `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
              boxShadow: `0 0 30px ${NEON_COLORS.primary}50`
            }}
          >
            开始游戏
          </motion.button>
        </motion.div>

        <style>{`
          .glass-card {
            background: rgba(26, 26, 46, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(108, 92, 231, 0.3);
          }
        `}</style>
      </div>
    );
  }

  // Result Screen
  if (phase === 'result') {
    const accuracy = engine.getAccuracy();
    const stats = {
      solved: engine.getState().solvedCount,
      skipped: engine.getState().skippedCount,
      hints: engine.getState().hintsUsed
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
           style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-6">
            {accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '💪'}
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
            游戏完成!
          </h1>
          
          <div className="glass-card rounded-2xl p-6 max-w-sm mx-auto mb-8">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-400">最终得分</div>
                <div className="text-3xl font-bold text-yellow-400">{score}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">正确率</div>
                <div className="text-3xl font-bold text-green-400">{accuracy}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">猜对</div>
                <div className="text-2xl font-bold text-cyan-400">{stats.solved}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">跳过</div>
                <div className="text-2xl font-bold text-orange-400">{stats.skipped}</div>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              使用提示: {stats.hints} 次
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startGame(difficulty)}
              className="px-8 py-3 text-lg font-bold rounded-xl text-white"
              style={{ 
                background: `linear-gradient(135deg, ${NEON_COLORS.success}, #00aa00)`,
                boxShadow: `0 0 20px ${NEON_COLORS.success}50`
              }}
            >
              再玩一次
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPhase('menu')}
              className="px-8 py-3 text-lg font-bold rounded-xl text-white"
              style={{ 
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}, #2a2a4e)`,
                border: `2px solid ${NEON_COLORS.primary}`
              }}
            >
              返回菜单
            </motion.button>
          </div>
        </motion.div>

        <style>{`
          .glass-card {
            background: rgba(26, 26, 46, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(108, 92, 231, 0.3);
          }
        `}</style>
      </div>
    );
  }

  // Game Screen
  return (
    <div className="min-h-screen p-4 flex flex-col"
         style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}>
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center mb-6"
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
          猜谜语
        </h1>
        <div className="flex gap-3">
          <div className="glass-card px-4 py-2 rounded-xl">
            <span className="text-gray-400 text-sm">进度</span>
            <span className="text-cyan-400 font-bold ml-2">{progress.current}/{progress.total}</span>
          </div>
          <div className="glass-card px-4 py-2 rounded-xl">
            <span className="text-gray-400 text-sm">得分</span>
            <span className="text-yellow-400 font-bold ml-2">{score}</span>
          </div>
          <div className="glass-card px-4 py-2 rounded-xl">
            <span className="text-gray-400 text-sm">连击</span>
            <span className="text-pink-400 font-bold ml-2">x{streak}</span>
          </div>
        </div>
      </motion.div>

      {/* Riddle Card */}
      {currentRiddle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center"
        >
          {/* Category Badge */}
          <div className="mb-4">
            <span className="px-4 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white text-sm font-bold">
              {currentRiddle.category}
            </span>
            <span className="ml-2 px-3 py-1 bg-gray-700 rounded-full text-gray-300 text-xs">
              {currentRiddle.difficulty === 'easy' ? '简单' : 
               currentRiddle.difficulty === 'medium' ? '中等' : '困难'}
            </span>
          </div>

          {/* Riddle Question */}
          <div className="glass-card rounded-2xl p-8 mb-8 max-w-2xl text-center">
            <div className="text-6xl mb-4">🤔</div>
            <div className="text-2xl font-bold text-white leading-relaxed">
              {currentRiddle.question}
            </div>
          </div>

          {/* Answer Input */}
          <form onSubmit={handleSubmit} className="w-full max-w-md mb-6">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={feedback !== 'pending'}
                placeholder="请输入谜底..."
                className="flex-1 px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors text-center text-xl"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!userAnswer.trim() || feedback !== 'pending'}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white font-bold disabled:opacity-50"
              >
                猜
              </motion.button>
            </div>
          </form>

          {/* Message */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-xl font-bold mb-4 ${
                  feedback === 'correct' ? 'text-green-400' : 
                  feedback === 'wrong' ? 'text-red-400' : 'text-gray-400'
                }`}
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hint Message */}
          <AnimatePresence>
            {hintMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-yellow-400 mb-4 px-6 py-3 bg-yellow-500/20 rounded-lg text-center"
              >
                💡 提示: {hintMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="flex gap-3 flex-wrap justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleHint}
              disabled={feedback !== 'pending'}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-white font-bold disabled:opacity-50"
            >
              💡 提示 (-5分)
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSkip}
              disabled={feedback !== 'pending'}
              className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl text-white font-bold disabled:opacity-50"
            >
              跳过
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReveal}
              disabled={feedback !== 'pending'}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl text-white font-bold disabled:opacity-50"
            >
              看答案 (-10分)
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Bottom Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-4 mt-6 justify-center"
      >
        <button
          onClick={() => startGame(difficulty)}
          className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-white font-bold hover:from-red-700 hover:to-orange-700 transition-all"
        >
          🔄 重新开始
        </button>
        <button
          onClick={() => setPhase('menu')}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-colors"
        >
          🏠 返回菜单
        </button>
      </motion.div>

      <style>{`
        .glass-card {
          background: rgba(26, 26, 46, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(108, 92, 231, 0.3);
        }
      `}</style>
    </div>
  );
}
