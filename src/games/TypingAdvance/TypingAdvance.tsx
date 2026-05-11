import { useState, useEffect, useCallback, useRef } from 'react';
import { TypingAdvanceEngine } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';

type GamePhase = 'menu' | 'playing' | 'result';
type Difficulty = 'easy' | 'medium' | 'hard';
type Mode = 'challenge' | 'endless';

const DIFFICULTIES = [
  { key: 'easy' as Difficulty, label: '简单', subtitle: '入门级文本', color: '#22c55e' },
  { key: 'medium' as Difficulty, label: '中等', subtitle: '进阶级文本', color: '#3b82f6' },
  { key: 'hard' as Difficulty, label: '困难', subtitle: '高难度文本', color: '#f59e0b' },
];

const MODES = [
  { key: 'challenge' as Mode, label: '挑战模式', subtitle: '完成一条文本', icon: '🏆' },
  { key: 'endless' as Mode, label: '无限模式', subtitle: '持续挑战', icon: '∞' },
];

export default function TypingAdvance() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [mode, setMode] = useState<Mode>('challenge');
  const [engine, setEngine] = useState(() => new TypingAdvanceEngine('challenge', 'easy'));
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [gameState, setGameState] = useState(engine.getState());
  const containerRef = useRef<HTMLDivElement>(null);

  const loadState = useCallback(() => {
    setGameState(engine.getState());
    
    if (engine.getState().gameOver) {
      setPhase('result');
    }
  }, [engine]);

  const startGame = (selectedMode: Mode, selectedDifficulty: Difficulty) => {
    const newEngine = new TypingAdvanceEngine(selectedMode, selectedDifficulty);
    setEngine(newEngine);
    setMode(selectedMode);
    setDifficulty(selectedDifficulty);
    setPhase('playing');
    
    const state = newEngine.getState();
    setGameState(state);
    
    // Focus container for keyboard input
    setTimeout(() => containerRef.current?.focus(), 0);
  };

  // Timer for real-time updates
  useEffect(() => {
    let intervalId: number | null = null;
    
    if (phase === 'playing') {
      intervalId = window.setInterval(() => {
        loadState();
      }, 100);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [phase, loadState]);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'playing') return;
      
      e.preventDefault();
      
      if (e.key === 'Backspace') {
        engine.deleteChar();
      } else if (e.key.length === 1) {
        engine.inputKey(e.key);
      } else if (e.key === 'Escape') {
        engine.end();
      }
      
      loadState();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, engine, loadState]);

  const getCharClass = (index: number) => {
    if (index < gameState.currentIndex) {
      return gameState.userInput[index] === gameState.currentText[index] 
        ? 'text-green-400' 
        : 'text-red-400';
    }
    if (index === gameState.currentIndex) {
      return 'text-white bg-cyan-500/30';
    }
    return 'text-gray-500';
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
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            打字进阶
          </h1>
          <p className="text-gray-400 mb-8 text-xl">Typing Advance</p>

          <div className="glass-card rounded-2xl p-8 max-w-md mx-auto mb-8">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">游戏特色</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>• 多种文本类型（编程、诗歌、演讲、经典文学）</li>
              <li>• 挑战模式和无限模式</li>
              <li>• 实时WPM和准确率统计</li>
              <li>• 准确率加分机制</li>
              <li>• 视觉反馈和动态效果</li>
            </ul>
          </div>

          {/* Mode Selection */}
          <h3 className="text-lg font-bold text-gray-300 mb-4">选择模式</h3>
          <div className="flex gap-4 mb-8 justify-center flex-wrap">
            {MODES.map((m) => (
              <motion.button
                key={m.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMode(m.key)}
                className={`px-6 py-4 rounded-xl font-bold transition-all ${
                  mode === m.key 
                    ? 'text-white ring-2 ring-white bg-gradient-to-r from-cyan-500 to-blue-500' 
                    : 'text-gray-400 bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="text-2xl mb-1">{m.icon}</div>
                <div className="text-lg">{m.label}</div>
                <div className="text-xs opacity-75">{m.subtitle}</div>
              </motion.button>
            ))}
          </div>

          {/* Difficulty Selection */}
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
            onClick={() => startGame(mode, difficulty)}
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
    const stats = engine.getStats();
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
            {gameState.wpm >= 60 ? '🏆' : gameState.wpm >= 40 ? '🎉' : '💪'}
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            挑战完成！
          </h1>
          
          <div className="glass-card rounded-2xl p-8 max-w-md mx-auto mb-8">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-400">WPM (每分钟字数)</div>
                <div className="text-4xl font-bold text-cyan-400">{gameState.wpm}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">准确率</div>
                <div className="text-4xl font-bold text-green-400">{gameState.accuracy}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">正确字符</div>
                <div className="text-2xl font-bold text-blue-400">{gameState.correctChars}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">错误字符</div>
                <div className="text-2xl font-bold text-red-400">{gameState.errorChars}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">得分</div>
                <div className="text-2xl font-bold text-yellow-400">{gameState.score}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">用时</div>
                <div className="text-2xl font-bold text-purple-400">{Math.round(stats.totalTime)}s</div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startGame(mode, difficulty)}
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
      ref={containerRef}
      className="min-h-screen p-4 flex flex-col outline-none"
      style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}
      tabIndex={0}
    >
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center mb-6 flex-wrap gap-2"
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          打字进阶
        </h1>
        <div className="flex gap-3 flex-wrap">
          <div className="glass-card px-4 py-2 rounded-xl">
            <span className="text-gray-400 text-sm">WPM</span>
            <span className="text-cyan-400 font-bold ml-2 text-xl">{gameState.wpm}</span>
          </div>
          <div className="glass-card px-4 py-2 rounded-xl">
            <span className="text-gray-400 text-sm">准确率</span>
            <span className="text-green-400 font-bold ml-2 text-xl">{gameState.accuracy}%</span>
          </div>
          <div className="glass-card px-4 py-2 rounded-xl">
            <span className="text-gray-400 text-sm">得分</span>
            <span className="text-yellow-400 font-bold ml-2 text-xl">{gameState.score}</span>
          </div>
          <div className="glass-card px-4 py-2 rounded-xl">
            <span className="text-gray-400 text-sm">关卡</span>
            <span className="text-purple-400 font-bold ml-2 text-xl">{gameState.level}</span>
          </div>
        </div>
      </motion.div>

      {/* Typing Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col items-center justify-center"
      >
        <div 
          className="glass-card rounded-2xl p-8 mb-8 max-w-4xl w-full"
        >
          <div className="text-2xl leading-relaxed font-mono break-words">
            {gameState.currentText.split('').map((char, index) => (
              <span
                key={index}
                className={`transition-colors duration-100 ${getCharClass(index)}`}
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        {/* Stats Display */}
        <div className="flex gap-8 mb-8 flex-wrap justify-center">
          <div className="text-center">
            <div className="text-gray-400 text-sm">已输入</div>
            <div className="text-2xl font-bold text-cyan-400">{gameState.currentIndex}/{gameState.totalChars}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-sm">正确</div>
            <div className="text-2xl font-bold text-green-400">{gameState.correctChars}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-sm">错误</div>
            <div className="text-2xl font-bold text-red-400">{gameState.errorChars}</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-gray-400 text-center">
          <p className="mb-2">按键盘开始输入 · Backspace删除 · ESC结束</p>
          <p className="text-sm text-gray-500">绿色 = 正确 · 红色 = 错误 · 白色背景 = 当前位置</p>
        </div>
      </motion.div>

      {/* Bottom Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-4 mt-6 justify-center"
      >
        <button
          onClick={() => startGame(mode, difficulty)}
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