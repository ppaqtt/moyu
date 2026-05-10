import { useState, useCallback } from 'react';
import { MathKidsEngine, Problem } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';

type GamePhase = 'menu' | 'playing' | 'result';
type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTIES: { value: Difficulty; label: string; ops: string }[] = [
  { value: 'easy', label: '简单', ops: '+ -' },
  { value: 'medium', label: '中等', ops: '+ - ×' },
  { value: 'hard', label: '困难', ops: '+ - × ÷' },
];

export default function MathKids() {
  const [engine, setEngine] = useState(() => new MathKidsEngine(10, 'easy'));
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [problemCount, setProblemCount] = useState(10);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<{ message: string; isCorrect: boolean } | null>(null);
  const [inputValue, setInputValue] = useState('');

  const startGame = useCallback(() => {
    const newEngine = new MathKidsEngine(problemCount, selectedDifficulty);
    setEngine(newEngine);
    setCurrentProblem(newEngine.getCurrentProblem());
    setProgress(newEngine.getProgress());
    setScore(0);
    setCorrectCount(0);
    setFeedback(null);
    setInputValue('');
    setPhase('playing');
  }, [selectedDifficulty, problemCount]);

  const handleSubmit = useCallback(() => {
    const answer = parseInt(inputValue);
    if (isNaN(answer)) {
      setFeedback({ message: '请输入数字!', isCorrect: false });
      return;
    }

    const result = engine.submitAnswer(answer);
    setFeedback(result);
    setScore(engine.getScore());
    setCorrectCount(engine.getState().correctCount);

    if (engine.isComplete()) {
      setTimeout(() => {
        setPhase('result');
        setFeedback(null);
      }, 1500);
    } else {
      setTimeout(() => {
        setCurrentProblem(engine.getCurrentProblem());
        setProgress(engine.getProgress());
        setFeedback(null);
        setInputValue('');
      }, 1500);
    }
  }, [engine, inputValue]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }, [handleSubmit]);

  const getOperationSymbol = (op: string) => {
    switch (op) {
      case '+': return '+';
      case '-': return '−';
      case '*': return '×';
      case '/': return '÷';
      default: return op;
    }
  };

  if (phase === 'menu') {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
            🔢 数学练习
          </h1>
          <p className="text-gray-400 mb-8">Math Kids</p>

          <div className="glass-card rounded-2xl p-6 max-w-md mx-auto mb-6">
            <h3 className="text-lg font-bold text-cyan-400 mb-3">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>1. 系统随机出题</li>
              <li>2. 在输入框中填写答案</li>
              <li>3. 点击提交或按回车确认</li>
              <li>4. 答对越多分数越高!</li>
            </ul>
          </div>

          <h3 className="text-lg font-bold text-gray-300 mb-3">选择难度</h3>
          <div className="flex gap-3 mb-6">
            {DIFFICULTIES.map((diff) => (
              <motion.button
                key={diff.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDifficulty(diff.value)}
                className={`px-4 py-3 rounded-xl font-bold transition-all ${
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
              >
                <div>{diff.label}</div>
                <div className="text-xs opacity-75">{diff.ops}</div>
              </motion.button>
            ))}
          </div>

          <h3 className="text-lg font-bold text-gray-300 mb-3">题目数量</h3>
          <div className="flex gap-3 mb-8">
            {[5, 10, 15, 20].map((count) => (
              <motion.button
                key={count}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setProblemCount(count)}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  problemCount === count ? 'text-white' : 'text-gray-400 bg-gray-800'
                }`}
                style={{
                  background: problemCount === count 
                    ? `linear-gradient(135deg, ${NEON_COLORS.secondary}, ${NEON_COLORS.primary})`
                    : undefined,
                }}
              >
                {count}题
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="px-12 py-4 text-xl font-bold rounded-2xl text-white"
            style={{ 
              background: `linear-gradient(135deg, ${NEON_COLORS.success}, #00aa00)`,
              boxShadow: `0 0 30px ${NEON_COLORS.success}50`
            }}
          >
            开始答题
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

  if (phase === 'result') {
    const state = engine.getState();
    const percentage = Math.round((state.correctCount / state.totalProblems) * 100);
    let grade = '';
    let gradeColor = '';
    
    if (percentage >= 90) { grade = '🌟 优秀!'; gradeColor = 'text-green-400'; }
    else if (percentage >= 70) { grade = '👍 良好'; gradeColor = 'text-cyan-400'; }
    else if (percentage >= 60) { grade = '📚 及格'; gradeColor = 'text-yellow-400'; }
    else { grade = '💪 加油'; gradeColor = 'text-red-400'; }

    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
            答题完成!
          </h1>
          
          <div className="glass-card rounded-2xl p-8 max-w-md mx-auto mb-8">
            <div className={`text-6xl font-bold mb-4 ${gradeColor}`}>{grade}</div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="text-sm text-gray-400">正确数</div>
                <div className="text-3xl font-bold text-green-400">{state.correctCount}</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="text-sm text-gray-400">错误数</div>
                <div className="text-3xl font-bold text-red-400">{state.wrongCount}</div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 mb-4">
              <div className="text-sm text-gray-400">总分</div>
              <div className="text-4xl font-bold text-yellow-400">{score}</div>
            </div>
            <div className="text-gray-400">
              正确率: {percentage}%
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="px-8 py-3 text-lg font-bold rounded-xl text-white"
              style={{ 
                background: `linear-gradient(135deg, ${NEON_COLORS.success}, #00aa00)`,
                boxShadow: `0 0 20px ${NEON_COLORS.success}50`
              }}
            >
              再来一次
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

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-4"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
          🔢 数学练习
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-6 mb-6"
      >
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">进度</div>
          <div className="text-2xl font-bold text-cyan-400">
            {progress.current}/{progress.total}
          </div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">得分</div>
          <div className="text-2xl font-bold text-yellow-400">{score}</div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">正确</div>
          <div className="text-2xl font-bold text-green-400">{correctCount}</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card rounded-2xl p-8 mb-6"
        style={{ minWidth: '400px' }}
      >
        {currentProblem && (
          <div className="text-center">
            <div className="text-6xl font-bold text-white mb-8">
              {currentProblem.num1} {getOperationSymbol(currentProblem.operation)} {currentProblem.num2} = ?
            </div>
            
            <div className="flex gap-4 justify-center mb-6">
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-40 px-6 py-4 text-3xl text-center rounded-xl bg-gray-800 text-white border-2 border-purple-500 focus:border-cyan-400 outline-none"
                placeholder="?"
                autoFocus
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                className="px-8 py-4 text-xl font-bold rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600"
              >
                提交
              </motion.button>
            </div>

            <div className="text-sm text-gray-400">
              按 Enter 键快速提交
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className={`glass-card px-8 py-4 rounded-xl mb-6 ${
              feedback.isCorrect ? 'border-green-500' : 'border-red-500'
            }`}
          >
            <div className={`text-2xl font-bold ${
              feedback.isCorrect ? 'text-green-400' : 'text-red-400'
            }`}>
              {feedback.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-4 mt-6">
        <button
          onClick={startGame}
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
      </div>

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
