import { useState, useEffect, useCallback, useRef } from 'react';
import { TranslateChallengeEngine, GameState } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';

type GamePhase = 'menu' | 'playing' | 'result';
type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTIES = [
  { key: 'easy' as Difficulty, label: '简单', subtitle: '日常对话', color: '#22c55e' },
  { key: 'medium' as Difficulty, label: '中等', subtitle: '谚语名言', color: '#3b82f6' },
  { key: 'hard' as Difficulty, label: '困难', subtitle: '复杂长句', color: '#f59e0b' },
];

export default function TranslateChallenge() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [engine, setEngine] = useState(() => new TranslateChallengeEngine('easy'));
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [gameState, setGameState] = useState<GameState>(engine.getState());
  const [userInput, setUserInput] = useState('');
  const [message, setMessage] = useState('');
  const messageTimeoutRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadState = useCallback(() => {
    const state = engine.getState();
    setGameState(state);
    
    if (state.gameOver) {
      setPhase('result');
    }
  }, [engine]);

  const startGame = (selectedDifficulty: Difficulty) => {
    const newEngine = new TranslateChallengeEngine(selectedDifficulty);
    newEngine.startGame();
    setEngine(newEngine);
    setDifficulty(selectedDifficulty);
    setUserInput('');
    setPhase('playing');
    setMessage('');
    setTimeout(() => {
      loadState();
      inputRef.current?.focus();
    }, 0);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!userInput.trim() || phase !== 'playing') return;
    
    const result = engine.submitAnswer(userInput);
    setMessage(result.message);
    
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = window.setTimeout(() => {
      setMessage('');
    }, 2000);
    
    loadState();
  };

  const handleSkip = () => {
    if (phase !== 'playing') return;
    engine.skip();
    setUserInput('');
    setMessage('跳过！');
    
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = window.setTimeout(() => {
      setMessage('');
    }, 2000);
    
    loadState();
  };

  // Auto-advance when correct
  useEffect(() => {
    if (phase === 'playing' && gameState.showResult && gameState.isCorrect) {
      const timer = setTimeout(() => {
        setUserInput('');
        loadState();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState.showResult, phase, loadState]);

  // Menu Screen
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
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 bg-clip-text text-transparent">
            翻译挑战
          </h1>
          <p className="text-gray-400 mb-8 text-xl">Translate Challenge</p>

          <div className="glass-card rounded-2xl p-8 max-w-md mx-auto mb-8">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>1. 看到英文句子，输入中文翻译</li>
              <li>2. 完全匹配或含义相近都算正确</li>
              <li>3. 连续答对获得连击加分</li>
              <li>4. 错误3次游戏结束</li>
              <li>5. 可以跳过，但会消耗一次机会</li>
            </ul>
          </div>

          <h3 className="text-lg font-bold text-gray-300 mb-4">选择难度</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
            {DIFFICULTIES.map((d) => (
              <motion.button
                key={d.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDifficulty(d.key)}
                className={`px-6 py-4 rounded-xl font-bold transition-all ${
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
            开始挑战
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
          <div className="text-8xl mb-6">
            {gameState.score >= 100 ? '🏆' : gameState.score >= 50 ? '🎉' : '💪'}
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-green-400 bg-clip-text text-transparent">
            挑战结束！
          </h1>
          
          <div className="glass-card rounded-2xl p-8 max-w-md mx-auto mb-8">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-400">最终得分</div>
                <div className="text-4xl font-bold text-yellow-400">{gameState.score}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">最高等级</div>
                <div className="text-4xl font-bold text-purple-400">{gameState.level}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">最高连击</div>
                <div className="text-2xl font-bold text-cyan-400">{gameState.combo}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">错误次数</div>
                <div className="text-2xl font-bold text-red-400">{gameState.mistakes}</div>
              </div>
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

  // Game Screen
  return (
    <div 
      className="min-h-screen p-4 flex flex-col"
      style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}
    >
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center mb-6 flex-wrap gap-2"
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-green-400 bg-clip-text text-transparent">
          翻译挑战
        </h1>
        <div className="flex gap-3 flex-wrap">
          <div className="glass-card px-4 py-2 rounded-xl">
            <span className="text-gray-400 text-sm">得分</span>
            <span className="text-yellow-400 font-bold ml-2 text-xl">{gameState.score}</span>
          </div>
          <div className="glass-card px-4 py-2 rounded-xl">
            <span className="text-gray-400 text-sm">连击</span>
            <span className="text-cyan-400 font-bold ml-2 text-xl">x{gameState.combo}</span>
          </div>
          <div className="glass-card px-4 py-2 rounded-xl">
            <span className="text-gray-400 text-sm">等级</span>
            <span className="text-purple-400 font-bold ml-2 text-xl">{gameState.level}</span>
          </div>
          <div className="glass-card px-4 py-2 rounded-xl">
            <span className="text-gray-400 text-sm">错误</span>
            <span className="text-red-400 font-bold ml-2 text-xl">{gameState.mistakes}/3</span>
          </div>
        </div>
      </motion.div>

      {/* Sentence Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col items-center justify-center"
      >
        {gameState.currentSentence && (
          <motion.div
            key={gameState.currentSentence.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card rounded-2xl p-8 mb-8 max-w-3xl w-full"
          >
            <div className="text-center mb-6">
              <div className={`text-xs font-bold mb-2 ${
                gameState.currentSentence.difficulty === 'easy' ? 'text-green-400' :
                gameState.currentSentence.difficulty === 'medium' ? 'text-blue-400' : 
                'text-yellow-400'
              }`}>
                {gameState.currentSentence.difficulty.toUpperCase()}
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                {gameState.currentSentence.english}
              </h2>
              
              {/* Answer Display After Submit */}
              {gameState.showResult && (
                <div className="mt-6 p-4 rounded-xl border-2">
                  <div className="text-sm text-gray-400 mb-2">你的答案：</div>
                  <div className="text-xl mb-4">{userInput}</div>
                  <div className="text-sm text-gray-400 mb-2">正确答案：</div>
                  <div className="text-xl text-green-400 font-bold">{gameState.currentSentence.chinese}</div>
                  <div className={`mt-4 text-2xl font-bold ${gameState.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {gameState.isCorrect ? '✓ 正确！' : '✗ 不对哦'}
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            {!gameState.showResult && (
              <form onSubmit={handleSubmit} className="flex gap-3 flex-wrap">
                <div className="flex-1 relative min-w-[200px]">
                  <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="输入中文翻译..."
                    className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors text-lg"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!userInput.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-green-500 rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-yellow-600 hover:to-green-600 transition-all"
                >
                  提交
                </button>
                
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-white font-bold hover:from-pink-600 hover:to-purple-600 transition-all"
                >
                  跳过
                </button>
              </form>
            )}
          </motion.div>
        )}

        {/* Message Display */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`glass-card px-6 py-3 rounded-xl mb-4 ${
                message.includes('正确') ? 'border-green-500' : 
                message.includes('跳过') ? 'border-yellow-500' : 
                'border-red-500'
              }`}
            >
              <p className={`font-bold ${
                message.includes('正确') ? 'text-green-400' : 
                message.includes('跳过') ? 'text-yellow-400' : 
                'text-red-400'
              }`}>
                {message}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

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