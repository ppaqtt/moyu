import { useState, useEffect, useCallback, useRef } from 'react';
import { WordMemoryEngine, GameState } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';

type GamePhase = 'menu' | 'playing' | 'result';
type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTIES = [
  { key: 'easy', label: '简单', subtitle: '入门级词汇', color: '#22c55e' },
  { key: 'medium', label: '中等', subtitle: '进阶词汇', color: '#3b82f6' },
  { key: 'hard', label: '困难', subtitle: '高级词汇', color: '#f59e0b' },
];

export default function WordMemory() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [engine, setEngine] = useState(() => new WordMemoryEngine('easy'));
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [gameState, setGameState] = useState<GameState>(engine.getState());
  const [message, setMessage] = useState<string>('');
  const messageTimeoutRef = useRef<number | null>(null);

  const loadState = useCallback(() => {
    const state = engine.getState();
    setGameState(state);
    
    if (state.gameOver) {
      setPhase('result');
    }
  }, [engine]);

  const startGame = (selectedDifficulty: Difficulty) => {
    const newEngine = new WordMemoryEngine(selectedDifficulty);
    newEngine.startGame();
    setEngine(newEngine);
    setDifficulty(selectedDifficulty);
    setPhase('playing');
    setMessage('');
    loadState();
  };

  const handleAnswer = (option: string) => {
    if (phase !== 'playing') return;
    
    const result = engine.answer(option);
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
    engine.skipWord();
    setMessage('跳过！-1次机会');
    
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = window.setTimeout(() => {
      setMessage('');
    }, 2000);
    
    loadState();
  };

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
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-500 bg-clip-text text-transparent">
            单词记忆
          </h1>
          <p className="text-gray-400 mb-8 text-xl">Word Memory Game</p>

          <div className="glass-card rounded-2xl p-8 max-w-md mx-auto mb-8">
            <h3 className="text-xl font-bold text-purple-400 mb-4">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>1. 看到英文单词，选择正确的中文意思</li>
              <li>2. 连续答对获得连击加分</li>
              <li>3. 错误3次或时间到游戏结束</li>
              <li>4. 可以跳过，但会消耗一次机会</li>
            </ul>
          </div>

          <h3 className="text-lg font-bold text-gray-300 mb-4">选择难度</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
            {DIFFICULTIES.map((d) => (
              <motion.button
                key={d.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDifficulty(d.key as Difficulty)}
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
            {gameState.score >= 100 ? '🏆' : gameState.score >= 50 ? '🎉' : '👍'}
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent">
            游戏结束！
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
              再来一局
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
        className="flex justify-between items-center mb-6"
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          单词记忆
        </h1>
        <div className="flex gap-3">
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

      {/* Word Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col items-center justify-center"
      >
        {gameState.currentWord && (
          <motion.div
            key={gameState.currentWord.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card rounded-2xl p-8 mb-8 max-w-2xl w-full"
          >
            <div className="text-center mb-6">
              <h2 className="text-5xl font-bold text-white mb-2">
                {gameState.currentWord.english}
              </h2>
              {gameState.currentWord.phonetic && (
                <p className="text-gray-400 text-xl">{gameState.currentWord.phonetic}</p>
              )}
              {gameState.currentWord.example && (
                <p className="text-gray-500 mt-4 italic">"{gameState.currentWord.example}"</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {gameState.options.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(option)}
                  className="px-6 py-4 rounded-xl font-bold text-lg transition-all bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 hover:border-purple-500"
                >
                  {option}
                </motion.button>
              ))}
            </div>
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
                message.includes('正确') ? 'border-green-500' : 'border-red-500'
              }`}
            >
              <p className={`font-bold ${message.includes('正确') ? 'text-green-400' : 'text-red-400'}`}>
                {message}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSkip}
          className="px-8 py-3 rounded-xl font-bold text-white bg-gray-700 hover:bg-gray-600"
        >
          跳过 (消耗1次机会)
        </motion.button>
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