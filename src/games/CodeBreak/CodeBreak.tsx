import { useState, useCallback } from 'react';
import { CodeBreakEngine, CodeLevel } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';

type GamePhase = 'menu' | 'playing' | 'complete';

export default function CodeBreak() {
  const [engine] = useState(() => new CodeBreakEngine());
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [currentLevel, setCurrentLevel] = useState<CodeLevel | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [score, setScore] = useState(0);
  const [totalLevels, setTotalLevels] = useState(10);
  const [hint, setHint] = useState('');
  const [isLevelComplete, setIsLevelComplete] = useState(false);

  const loadState = useCallback(() => {
    const state = engine.getState();
    setCurrentLevel(engine.getCurrentLevel());
    setAttempts(state.attempts);
    setMaxAttempts(state.maxAttempts);
    setScore(state.score);
    setTotalLevels(engine.getTotalLevels());
    setMessage('');
    setHint('');
    setIsLevelComplete(false);
  }, [engine]);

  const startGame = useCallback(() => {
    engine.reset();
    loadState();
    setPhase('playing');
  }, [engine, loadState]);

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim()) return;

    const result = engine.guess(inputValue);
    setMessage(result.message);
    loadState();

    if (result.levelComplete) {
      setTimeout(() => setPhase('complete'), 2000);
    } else if (result.correct) {
      setIsLevelComplete(true);
      setTimeout(() => {
        setInputValue('');
        setIsLevelComplete(false);
      }, 1000);
    }

    setInputValue('');
  }, [engine, inputValue, loadState]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleHint = useCallback(() => {
    const result = engine.useHint();
    if (result.success) {
      setHint(`💡 提示: ${result.clue}`);
    } else {
      setHint('没有更多提示了!');
    }
  }, [engine]);

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
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            🔐 密码破译
          </h1>
          <p className="text-gray-400 mb-8">Code Break</p>

          <div className="glass-card rounded-2xl p-6 max-w-md mx-auto mb-6">
            <h3 className="text-lg font-bold text-cyan-400 mb-3">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>1. 根据提示推断密码</li>
              <li>2. 输入密码按回车提交</li>
              <li>3. 每关有5次尝试机会</li>
              <li>4. 答对越快分数越高!</li>
            </ul>
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="glass-card px-6 py-4 rounded-xl">
              <div className="text-4xl">🔐</div>
              <div className="text-sm text-gray-400 mt-2">10个关卡</div>
            </div>
            <div className="glass-card px-6 py-4 rounded-xl">
              <div className="text-4xl">🧠</div>
              <div className="text-sm text-gray-400 mt-2">解谜挑战</div>
            </div>
            <div className="glass-card px-6 py-4 rounded-xl">
              <div className="text-4xl">💡</div>
              <div className="text-sm text-gray-400 mt-2">提示系统</div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="px-12 py-4 text-xl font-bold rounded-2xl text-white"
            style={{ 
              background: `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
              boxShadow: `0 0 30px ${NEON_COLORS.primary}50`
            }}
          >
            开始破译
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

  if (phase === 'complete') {
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
          <div className="text-8xl mb-6">🏆</div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            密码大师!
          </h1>
          <p className="text-2xl text-gray-300 mb-2">你成功破解了所有密码!</p>
          
          <div className="glass-card rounded-2xl p-8 max-w-sm mx-auto mb-8">
            <div className="text-sm text-gray-400">最终得分</div>
            <div className="text-6xl font-bold text-yellow-400 mb-4">{score}</div>
            <div className="text-gray-400">
              破解了 {totalLevels} 个密码
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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
          🔐 密码破译 - 第 {currentLevel?.id || 1} 关
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-4 mb-4"
      >
        <div className="glass-card px-4 py-2 rounded-xl">
          <div className="text-sm text-gray-400">关卡</div>
          <div className="text-xl font-bold text-purple-400">{currentLevel?.id || 1}/{totalLevels}</div>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl">
          <div className="text-sm text-gray-400">尝试</div>
          <div className={`text-xl font-bold ${attempts >= maxAttempts - 2 ? 'text-red-400' : 'text-cyan-400'}`}>
            {attempts}/{maxAttempts}
          </div>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl">
          <div className="text-sm text-gray-400">分数</div>
          <div className="text-xl font-bold text-yellow-400">{score}</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card rounded-2xl p-6 mb-4"
        style={{ minWidth: '400px' }}
      >
        <div className="text-center mb-4">
          <div className="text-sm text-gray-400 mb-2">密码提示</div>
          <div className="text-xl text-white font-bold">
            💡 {currentLevel?.hint || ''}
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            className="flex-1 px-4 py-3 text-xl text-center rounded-xl bg-gray-800 text-white border-2 border-purple-500 focus:border-cyan-400 outline-none uppercase"
            placeholder="输入密码..."
            maxLength={10}
            autoFocus
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            className="px-6 py-3 text-lg font-bold rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600"
          >
            破解
          </motion.button>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleHint}
          className="w-full px-4 py-2 rounded-lg text-sm font-bold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
        >
          💡 使用提示 (-50分)
        </motion.button>

        {hint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-center text-yellow-400"
          >
            {hint}
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={`glass-card px-6 py-3 rounded-xl mb-4 ${
              message.includes('✅') || message.includes('🎉') ? 'border-green-500' :
              message.includes('❌') ? 'border-red-500' : 'border-yellow-500'
            }`}
          >
            <div className={`text-lg font-bold ${
              message.includes('✅') || message.includes('🎉') ? 'text-green-400' :
              message.includes('❌') ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-4 mt-4">
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
