import { useState, useEffect, useCallback, useRef } from 'react';
import { TypingMasterEngine, KeyStat } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';

type GamePhase = 'menu' | 'playing' | 'result';
type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';
type GameMode = 'time' | 'practice';

const DIFFICULTIES = [
  { key: 'easy', label: '简单', subtitle: '短句练习', color: '#22c55e' },
  { key: 'medium', label: '中等', subtitle: '中等段落', color: '#3b82f6' },
  { key: 'hard', label: '困难', subtitle: '长段落', color: '#f59e0b' },
  { key: 'mixed', label: '混合', subtitle: '全部难度', color: '#a855f7' }
];

const TIME_LIMITS = [
  { value: 30, label: '30秒' },
  { value: 60, label: '1分钟' },
  { value: 120, label: '2分钟' },
  { value: 180, label: '3分钟' }
];

export default function TypingMaster() {
  const [mode, setMode] = useState<GameMode>('time');
  const [difficulty, setDifficulty] = useState<Difficulty>('mixed');
  const [timeLimit, setTimeLimit] = useState(60);
  const [engine, setEngine] = useState(() => new TypingMasterEngine('time', 'mixed', 60));
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [currentText, setCurrentText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [correctChars, setCorrectChars] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [keyStats, setKeyStats] = useState<KeyStat[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const loadState = useCallback(() => {
    const state = engine.getState();
    setCurrentText(state.currentText);
    setUserInput(state.userInput);
    setCurrentIndex(state.currentIndex);
    setWpm(state.wpm);
    setAccuracy(state.accuracy);
    setTimeRemaining(state.timeRemaining);
    setCorrectChars(state.correctChars);
    setErrorCount(state.errorCount);
    setKeyStats(engine.getKeyStats());

    if (state.isComplete) {
      setPhase('result');
    }
  }, [engine]);

  const startGame = (selectedMode: GameMode, selectedDifficulty: Difficulty, selectedTimeLimit: number) => {
    const newEngine = new TypingMasterEngine(selectedMode, selectedDifficulty, selectedTimeLimit);
    setEngine(newEngine);
    setMode(selectedMode);
    setDifficulty(selectedDifficulty);
    setTimeLimit(selectedTimeLimit);

    const state = newEngine.getState();
    setCurrentText(state.currentText);
    setUserInput('');
    setCurrentIndex(0);
    setWpm(0);
    setAccuracy(100);
    setTimeRemaining(selectedTimeLimit);
    setCorrectChars(0);
    setErrorCount(0);
    setPhase('playing');
  };

  // Timer update
  useEffect(() => {
    if (phase === 'playing') {
      const interval = setInterval(() => {
        loadState();
      }, 100);
      return () => clearInterval(interval);
    }
  }, [phase, engine, loadState]);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'playing') return;

      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        engine.inputKey(e.key);
        loadState();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        engine.deleteChar();
        loadState();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        engine.end();
        loadState();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, engine, loadState]);

  // Focus container
  useEffect(() => {
    if (phase === 'playing' && containerRef.current) {
      containerRef.current.focus();
    }
  }, [phase]);

  // Auto-scroll text
  useEffect(() => {
    if (textRef.current && currentIndex > 0) {
      const charElements = textRef.current.querySelectorAll('.char');
      if (charElements[currentIndex]) {
        charElements[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentIndex]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCharClass = (index: number): string => {
    if (index < userInput.length) {
      return userInput[index] === currentText[index] ? 'text-green-400' : 'text-red-400';
    }
    if (index === currentIndex) {
      return 'text-white bg-cyan-500/30';
    }
    return 'text-gray-500';
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
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-green-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
            Typing Master
          </h1>
          <p className="text-gray-400 mb-8 text-xl">打字速度测试</p>

          <div className="glass-card rounded-2xl p-8 max-w-md mx-auto mb-8">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>1. 根据屏幕上的文字进行输入</li>
              <li>2. 正确输入的字符显示绿色</li>
              <li>3. 错误的字符显示红色</li>
              <li>4. 按Backspace可以删除</li>
              <li>5. 时间结束或完成查看成绩</li>
            </ul>
          </div>

          {/* Mode Selection */}
          <h3 className="text-lg font-bold text-gray-300 mb-4">游戏模式</h3>
          <div className="flex gap-4 mb-6 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMode('time')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                mode === 'time'
                  ? 'text-white ring-2 ring-white bg-gradient-to-r from-cyan-500 to-blue-500'
                  : 'text-gray-400 bg-gray-800 hover:bg-gray-700'
              }`}
            >
              计时模式
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMode('practice')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                mode === 'practice'
                  ? 'text-white ring-2 ring-white bg-gradient-to-r from-cyan-500 to-blue-500'
                  : 'text-gray-400 bg-gray-800 hover:bg-gray-700'
              }`}
            >
              练习模式
            </motion.button>
          </div>

          {/* Difficulty Selection */}
          <h3 className="text-lg font-bold text-gray-300 mb-4">选择难度</h3>
          <div className="grid grid-cols-2 gap-4 mb-6 max-w-md mx-auto">
            {DIFFICULTIES.map((d) => (
              <motion.button
                key={d.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDifficulty(d.key as Difficulty)}
                className={`px-5 py-3 rounded-xl font-bold transition-all ${
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

          {/* Time Limit Selection */}
          {mode === 'time' && (
            <>
              <h3 className="text-lg font-bold text-gray-300 mb-4">时间限制</h3>
              <div className="flex gap-3 mb-8 justify-center">
                {TIME_LIMITS.map((t) => (
                  <motion.button
                    key={t.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setTimeLimit(t.value)}
                    className={`px-4 py-2 rounded-xl font-bold transition-all ${
                      timeLimit === t.value
                        ? 'text-white ring-2 ring-white bg-gradient-to-r from-pink-500 to-purple-500'
                        : 'text-gray-400 bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    {t.label}
                  </motion.button>
                ))}
              </div>
            </>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => startGame(mode, difficulty, timeLimit)}
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
    const weakKeys = engine.getWeakKeys();

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
           style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-6">
            {wpm >= 60 ? '🏆' : wpm >= 40 ? '🎉' : wpm >= 20 ? '👍' : '💪'}
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
            测试完成!
          </h1>

          <div className="glass-card rounded-2xl p-6 max-w-md mx-auto mb-8">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <div className="text-sm text-gray-400">WPM (每分钟字数)</div>
                <div className="text-4xl font-bold text-cyan-400">{wpm}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">准确率</div>
                <div className="text-4xl font-bold text-green-400">{accuracy}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">正确字符</div>
                <div className="text-2xl font-bold text-blue-400">{correctChars}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">错误次数</div>
                <div className="text-2xl font-bold text-red-400">{errorCount}</div>
              </div>
            </div>

            {weakKeys.length > 0 && (
              <div className="border-t border-gray-700 pt-4">
                <div className="text-sm text-gray-400 mb-2">需要加强练习的按键:</div>
                <div className="flex gap-2 justify-center flex-wrap">
                  {weakKeys.map((stat) => (
                    <span key={stat.key} className="px-3 py-1 bg-red-500/30 text-red-400 rounded-lg text-sm">
                      {stat.key === ' ' ? '空格' : stat.key}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startGame(mode, difficulty, timeLimit)}
              className="px-8 py-3 text-lg font-bold rounded-xl text-white"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.success}, #00aa00)`,
                boxShadow: `0 0 20px ${NEON_COLORS.success}50`
              }}
            >
              再测一次
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
        className="flex justify-between items-center mb-6"
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent">
          Typing Master
        </h1>
        <div className="flex gap-3">
          <div className="glass-card px-4 py-2 rounded-xl">
            <span className="text-gray-400 text-sm">WPM</span>
            <span className="text-cyan-400 font-bold ml-2 text-xl">{wpm}</span>
          </div>
          <div className="glass-card px-4 py-2 rounded-xl">
            <span className="text-gray-400 text-sm">准确率</span>
            <span className="text-green-400 font-bold ml-2 text-xl">{accuracy}%</span>
          </div>
          {mode === 'time' && (
            <div className={`glass-card px-4 py-2 rounded-xl ${timeRemaining <= 10 ? 'border-2 border-red-500' : ''}`}>
              <span className="text-gray-400 text-sm">时间</span>
              <span className={`font-bold ml-2 text-xl ${timeRemaining <= 10 ? 'text-red-400' : 'text-yellow-400'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Typing Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col items-center justify-center"
      >
        {/* Text Display */}
        <div
          ref={textRef}
          className="glass-card rounded-2xl p-8 mb-8 max-w-4xl w-full overflow-y-auto"
          style={{ maxHeight: '300px' }}
        >
          <div className="text-2xl leading-relaxed font-mono break-words">
            {currentText.split('').map((char, index) => (
              <span
                key={index}
                className={`char transition-colors duration-100 ${getCharClass(index)}`}
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-8 mb-8">
          <div className="text-center">
            <div className="text-gray-400 text-sm">已输入</div>
            <div className="text-2xl font-bold text-cyan-400">{currentIndex}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-sm">正确</div>
            <div className="text-2xl font-bold text-green-400">{correctChars}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-sm">错误</div>
            <div className="text-2xl font-bold text-red-400">{errorCount}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-sm">进度</div>
            <div className="text-2xl font-bold text-yellow-400">{Math.round((currentIndex / currentText.length) * 100)}%</div>
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
          onClick={() => {
            engine.stopTimer();
            startGame(mode, difficulty, timeLimit);
          }}
          className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-white font-bold hover:from-red-700 hover:to-orange-700 transition-all"
        >
          🔄 重新开始
        </button>
        <button
          onClick={() => {
            engine.stopTimer();
            setPhase('menu');
          }}
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
