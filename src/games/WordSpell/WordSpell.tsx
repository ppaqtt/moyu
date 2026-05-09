import { useState, useEffect, useCallback, useRef } from 'react';
import { WordSpellEngine, Word } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';

type GamePhase = 'menu' | 'playing' | 'result';
type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';

const DIFFICULTIES = [
  { key: 'easy', label: '简单', subtitle: '5字母单词', color: '#22c55e' },
  { key: 'medium', label: '中等', subtitle: '7-8字母单词', color: '#3b82f6' },
  { key: 'hard', label: '困难', subtitle: '9+字母单词', color: '#f59e0b' },
  { key: 'mixed', label: '混合', subtitle: '全部难度', color: '#a855f7' }
];

export default function WordSpell() {
  const [difficulty, setDifficulty] = useState<Difficulty>('mixed');
  const [engine, setEngine] = useState(() => new WordSpellEngine('mixed', 10));
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [userInput, setUserInput] = useState('');
  const [revealedLetters, setRevealedLetters] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [progress, setProgress] = useState({ current: 0, total: 10 });
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'pending'>('pending');
  const [message, setMessage] = useState('');
  const [hintMessage, setHintMessage] = useState('');
  const [showExample, setShowExample] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadState = useCallback(() => {
    const state = engine.getState();
    setCurrentWord(state.currentWord);
    setUserInput(state.userInput);
    setRevealedLetters(state.revealedLetters);
    setScore(state.score);
    setStreak(state.streak);
    setProgress(engine.getProgress());
    setFeedback(state.feedback);
  }, [engine]);

  const startGame = (diff: Difficulty) => {
    const newEngine = new WordSpellEngine(diff, 10);
    setEngine(newEngine);
    setDifficulty(diff);
    
    const state = newEngine.getState();
    setCurrentWord(state.currentWord);
    setUserInput('');
    setRevealedLetters([]);
    setScore(0);
    setStreak(0);
    setProgress({ current: 1, total: 10 });
    setFeedback('pending');
    setMessage('');
    setHintMessage('');
    setShowExample(false);
    setPhase('playing');
  };

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'playing') return;

      if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
        e.preventDefault();
        engine.inputLetter(e.key);
        loadState();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        engine.deleteLetter();
        loadState();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, engine, loadState]);

  // Focus input
  useEffect(() => {
    if (phase === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase, currentWord]);

  const handleSubmit = () => {
    const result = engine.submitAnswer();
    setMessage(result.message);
    loadState();

    if (result.correct || engine.getFeedback() === 'wrong') {
      setTimeout(() => {
        if (engine.isGameComplete()) {
          setPhase('result');
        } else {
          engine.nextWord();
          loadState();
          setMessage('');
          setHintMessage('');
          setShowExample(false);
        }
      }, 1500);
    }
  };

  const handleHint = () => {
    const hint = engine.useHint();
    if (hint.type) {
      loadState();
      setHintMessage(hint.data || '');
      setTimeout(() => setHintMessage(''), 5000);
    }
  };

  const handleSkip = () => {
    engine.skipWord();
    loadState();
    setMessage('');
    setHintMessage('');
    setShowExample(false);
  };

  const handleReveal = () => {
    const answer = engine.revealAnswer();
    loadState();
    setMessage(`答案是: ${answer}`);
    
    setTimeout(() => {
      if (engine.isGameComplete()) {
        setPhase('result');
      } else {
        engine.nextWord();
        loadState();
        setMessage('');
        setHintMessage('');
        setShowExample(false);
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
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            Word Spell
          </h1>
          <p className="text-gray-400 mb-8 text-xl">单词拼写挑战</p>

          <div className="glass-card rounded-2xl p-8 max-w-md mx-auto mb-8">
            <h3 className="text-xl font-bold text-pink-400 mb-4">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>1. 根据中文释义拼写英文单词</li>
              <li>2. 使用键盘输入字母</li>
              <li>3. 每题有3次尝试机会</li>
              <li>4. 连续答对可获得连击加分!</li>
              <li>5. 完成10个单词查看成绩</li>
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
      correct: engine.getState().correctCount,
      wrong: engine.getState().wrongCount,
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
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
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
                <div className="text-sm text-gray-400">答对</div>
                <div className="text-2xl font-bold text-cyan-400">{stats.correct}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">答错</div>
                <div className="text-2xl font-bold text-red-400">{stats.wrong}</div>
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
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          Word Spell
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

      {/* Word Card */}
      {currentWord && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center"
        >
          {/* Meaning */}
          <div className="glass-card rounded-2xl p-8 mb-8 text-center max-w-lg">
            <div className="text-gray-400 text-sm mb-2">中文释义</div>
            <div className="text-3xl font-bold text-white mb-4">{currentWord.meaning}</div>
            
            {currentWord.phonetic && (
              <div className="text-gray-400 text-sm mb-2">音标</div>
            )}
            {currentWord.phonetic && (
              <div className="text-xl text-cyan-400 mb-4">{currentWord.phonetic}</div>
            )}
            
            <div className="flex gap-2 justify-center">
              <span className="px-3 py-1 bg-gray-700 rounded-full text-xs text-gray-300">
                {currentWord.difficulty === 'easy' ? '简单' : 
                 currentWord.difficulty === 'medium' ? '中等' : '困难'}
              </span>
              <span className="px-3 py-1 bg-gray-700 rounded-full text-xs text-gray-300">
                {currentWord.category}
              </span>
            </div>
          </div>

          {/* Letter Slots */}
          <div className="flex gap-2 mb-8 flex-wrap justify-center">
            {currentWord.word.split('').map((letter, index) => {
              const isRevealed = revealedLetters.includes(index);
              const userLetter = userInput[index];
              const isFilled = !!userLetter;
              
              return (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`w-14 h-16 rounded-xl flex items-center justify-center text-2xl font-bold transition-all ${
                    feedback === 'correct' 
                      ? 'bg-green-500/50 border-2 border-green-500' 
                      : feedback === 'wrong'
                        ? 'bg-red-500/50 border-2 border-red-500'
                        : isRevealed
                          ? 'bg-yellow-500/30 border-2 border-yellow-500'
                          : isFilled
                            ? 'bg-cyan-500/30 border-2 border-cyan-500'
                            : 'bg-gray-800/50 border-2 border-gray-600'
                  }`}
                >
                  {isRevealed ? (
                    <span className="text-yellow-400">{letter}</span>
                  ) : isFilled ? (
                    <span className="text-cyan-400">{userLetter}</span>
                  ) : (
                    <span className="text-gray-600">_</span>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Hidden Input */}
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={() => {}}
            className="absolute opacity-0 pointer-events-none"
            maxLength={currentWord.word.length}
          />

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
                className="text-yellow-400 mb-4 px-4 py-2 bg-yellow-500/20 rounded-lg"
              >
                💡 {hintMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Example Sentence */}
          <AnimatePresence>
            {showExample && currentWord.example && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-gray-400 mb-4 italic"
              >
                例句: {currentWord.example}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="flex gap-3 flex-wrap justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={userInput.length !== currentWord.word.length || feedback !== 'pending'}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              提交答案
            </motion.button>
            
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
              onClick={() => setShowExample(!showExample)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white font-bold"
            >
              {showExample ? '隐藏例句' : '显示例句'}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSkip}
              disabled={feedback !== 'pending'}
              className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl text-white font-bold disabled:opacity-50"
            >
              跳过 (-5分)
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReveal}
              disabled={feedback !== 'pending'}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl text-white font-bold disabled:opacity-50"
            >
              显示答案 (-10分)
            </motion.button>
          </div>

          {/* Keyboard Hint */}
          <div className="mt-6 text-gray-400 text-sm">
            按键盘字母输入 · Backspace删除 · Enter提交
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
